import {unstable_cache} from 'next/cache';
import NewsRefresh from './NewsRefresh';

export const dynamic='force-dynamic';

const FEED='https://news.google.com/rss/search?q=Juventus&hl=it&gl=IT&ceid=IT:it';
const X_FEED_BASE='https://rsshub.stsecurity.moe';
const SOCIAL_MAX_AGE=3*24*60*60*1000;

const SOCIAL_SOURCES=[
 {name:'Juventus',handle:'juventusfc',official:true},
 {name:'Gianluca Di Marzio',handle:'DiMarzio'},
 {name:'Fabrizio Romano',handle:'FabrizioRomano'},
 {name:'Nicolò Schira',handle:'NicoSchira'},
 {name:'Gianluigi Longari',handle:'Glongari'},
 {name:'Romeo Agresti',handle:'romeoagresti'},
 {name:'TUTTOmercatoWEB',handle:'TuttoMercatoWeb'},
 {name:'Cronache di Spogliatoio',handle:'CronacheTweet'},
 {name:'Calcio e Finanza',handle:'CalcioFinanza'},
 {name:'Paolo Ardoino',handle:'paoloardoino',ardoino:true}
];

function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function decodeXml(s=''){
 return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
  .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
}
function xmlText(block,tag){
 const m=block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));
 return m?decodeXml(m[1].trim()):'';
}
function cleanHtml(value=''){
 return decodeXml(value)
  .replace(/<br\s*\/?\s*>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/https?:\/\/t\.co\/\S+/gi,'')
  .replace(/\s+/g,' ')
  .trim();
}
function relevantToJuve(body='',source={}){
 if(/\b(juventus|juve|bianconer\w*|allianz\s*stadium)\b/i.test(body)) return true;
 if(/\b(spalletti|yildiz|miretti|bremer|thuram|koopmeiners|cambiaso|vicario|di\s*gregorio|chiellini|comolli)\b/i.test(body)) return true;
 if(/\bkolo\s*muani\b/i.test(body)&&/\b(spalletti|juve|juventus)\b/i.test(body)) return true;
 return Boolean(source.ardoino&&/\b(zebra|zebre|jay)\b/i.test(body));
}
function parseNewsFeed(xml){
 const seen=new Set();
 return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
  .map(m=>{
   const b=m[1];
   const date=xmlText(b,'pubDate');
   return {title:xmlText(b,'title'),link:xmlText(b,'link'),date,source:xmlText(b,'source'),ts:Date.parse(date)||0};
  })
  .filter(x=>x.title&&x.link)
  .sort((a,b)=>b.ts-a.ts)
  .filter(x=>{
   const key=x.title.toLowerCase().replace(/\s+/g,' ').trim();
   if(seen.has(key)) return false;
   seen.add(key);
   return true;
  })
  .slice(0,60);
}
function parseXFeed(xml,source){
 return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
  .map(m=>{
   const b=m[1];
   const date=xmlText(b,'pubDate')||xmlText(b,'dc:date');
   const title=cleanHtml(xmlText(b,'title'));
   const desc=cleanHtml(xmlText(b,'description'));
   const encoded=cleanHtml(xmlText(b,'content:encoded'));
   let body=[encoded,desc,title].sort((a,b)=>b.length-a.length)[0]||'';
   body=body.replace(/^RT by @?[^:]+:\s*/i,'').replace(/^RT @?[^:]+:\s*/i,'').trim();
   const rawLink=xmlText(b,'link')||xmlText(b,'guid');
   const status=rawLink.match(/\/status\/(\d+)/)?.[1];
   const link=status?`https://x.com/${source.handle}/status/${status}`:`https://x.com/${source.handle}`;
   return {source:source.name,platform:'X',body,date,ts:Date.parse(date)||0,link};
  })
  .filter(p=>p.body&&(source.official||relevantToJuve(p.body,source)));
}
function formatDate(value){
 try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return ''}
}
async function fetchXXml(handle){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),4500);
 try{
  const r=await fetch(`${X_FEED_BASE}/twitter/user/${handle}/exclude_replies`,{
   cache:'no-store',signal:controller.signal,redirect:'follow',
   headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5'}
  });
  if(!r.ok) throw new Error(`http ${r.status}`);
  const xml=await r.text();
  if(!/<item>/i.test(xml)) throw new Error('empty feed');
  return xml;
 }finally{clearTimeout(timer)}
}
const getCachedXXml=unstable_cache(
 async handle=>fetchXXml(handle),
 ['jump-press-x-feed-v5'],
 {revalidate:600}
);
async function getXForSource(source){
 try{
  const xml=await getCachedXXml(source.handle);
  return parseXFeed(xml,source).slice(0,12);
 }catch{return []}
}
function dedupePosts(posts=[]){
 const seen=new Set();
 return posts.sort((a,b)=>b.ts-a.ts).filter(p=>{
  const key=p.body.toLowerCase().replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();
  if(!key||seen.has(key)) return false;
  seen.add(key);
  return true;
 });
}
async function buildSocialNews(){
 const groups=[];
 for(let i=0;i<SOCIAL_SOURCES.length;i+=2){
  const batch=SOCIAL_SOURCES.slice(i,i+2);
  const settled=await Promise.allSettled(batch.map(getXForSource));
  for(const result of settled) if(result.status==='fulfilled') groups.push(result.value);
  if(i+2<SOCIAL_SOURCES.length) await sleep(140);
 }
 const cutoff=Date.now()-SOCIAL_MAX_AGE;
 const counts=new Map();
 const posts=dedupePosts(groups.flat())
  .filter(p=>p.ts>=cutoff)
  .filter(p=>{
   const max=p.source==='Juventus'?4:7;
   const n=counts.get(p.source)||0;
   if(n>=max) return false;
   counts.set(p.source,n+1);
   return true;
  })
  .slice(0,50);
 if(!posts.length) throw new Error('social feed unavailable');
 return posts;
}
const getCachedSocialNews=unstable_cache(
 buildSocialNews,
 ['jump-press-social-snapshot-v5'],
 {revalidate:600}
);
async function getSocialNews(){
 try{return await getCachedSocialNews();}
 catch{return []}
}
async function getNews(){
 try{
  const r=await fetch(FEED,{next:{revalidate:300},headers:{'User-Agent':'Mozilla/5.0'}});
  if(!r.ok) throw new Error('feed');
  return parseNewsFeed(await r.text());
 }catch{return []}
}

export default async function NewsPage({searchParams}){
 const params=await searchParams;
 const tab=params?.tab==='social'?'social':'web';
 const news=tab==='web'?await getNews():[];
 const social=tab==='social'?await getSocialNews():[];
 return <main className="newspage">
  <NewsRefresh/>
  <header className="newsheader">
   <div className="top"><div className="brand"><i>JUMP</i> PRESS</div><div className="edition">JUVENTUS · NEWS LIVE</div></div>
   <small>NEWS</small>
   <h1>Juventus <em>news</em></h1>
   <p className="lead">Radar dedicato esclusivamente a <b>Juventus</b>, con fonti web e social selezionate.</p>
   <div className="newstabs">
    <a className={tab==='web'?'active':''} href="/news">WEB</a>
    <a className={tab==='social'?'active':''} href="/news?tab=social">SOCIAL</a>
   </div>
   <div className="newsstatus"><span className="liveDot"/> Aggiornamento automatico · 20 min</div>
  </header>

  {tab==='web'?<section className="newslist">
   {news.length?news.map((n,i)=><a className="newscard" href={n.link} target="_blank" rel="noreferrer" key={`${n.link}-${i}`}>
    <div className="newsmeta"><b>{n.source||'Notizia'}</b><span>{formatDate(n.date)}</span></div>
    <h2>{n.title}</h2>
    <span className="newsopen">Apri notizia ↗</span>
   </a>):<div className="newsempty"><b>Nessuna notizia disponibile in questo momento.</b><span>Il feed verrà riprovato automaticamente.</span></div>}
  </section>:<>
   <section className="socialintro">
    <b>Social Juventus · ultimi aggiornamenti</b>
    <span>X: fonti selezionate e filtrate sulla Juventus. Il feed conserva uno snapshot stabile e si rinnova ogni 10 minuti.</span>
   </section>
   <section className="socialfeed">
    {social.length?social.map((p,i)=><a className="socialpost" href={p.link} target="_blank" rel="noreferrer" key={`${p.link}-${i}`}>
     <div className="newsmeta"><b>{p.platform} · {p.source}</b><span>{formatDate(p.date)}</span></div>
     <p className="socialtext">{p.body}</p>
     <span className="newsopen">Apri su X ↗</span>
    </a>):<div className="newsempty"><b>Feed social temporaneamente non raggiungibile.</b><span>Riprova con Aggiorna tra poco: i post validi vengono mantenuti in cache quando la fonte risponde.</span></div>}
   </section>
  </>}

  <footer><b>JUMP PRESS</b> · News Juventus · <span>refresh automatico ogni 20 minuti</span></footer>
 </main>;
}