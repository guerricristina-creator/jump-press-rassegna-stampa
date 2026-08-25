import NewsRefresh from './NewsRefresh';

export const dynamic='force-dynamic';

const FEED='https://news.google.com/rss/search?q=Juventus&hl=it&gl=IT&ceid=IT:it';

const SOCIAL_SOURCES=[
 {name:'Juventus',handle:'juventusfc',official:true},
 {name:'Gianluca Di Marzio',handle:'DiMarzio'},
 {name:'Fabrizio Romano',handle:'FabrizioRomano'},
 {name:'Nicolò Schira',handle:'NicoSchira'},
 {name:'Gianluigi Longari',handle:'Glongari'},
 {name:'Romeo Agresti',handle:'romeoagresti'},
 {name:'TUTTOmercatoWEB',handle:'TuttoMercatoWeb'},
 {name:'Cronache di Spogliatoio',handle:'CronacheTweet'}
];

const RSSHUB_INSTANCES=[
 'https://rsshub.stsecurity.moe',
 'https://rsshub.mt.cd',
 'https://rsshub.yfi.moe'
];

function decodeXml(s=''){
 return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
  .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
}
function text(block,tag){
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
function parseFeed(xml){
 const seen=new Set();
 return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
  .map(m=>{
   const b=m[1];
   const date=text(b,'pubDate');
   return {title:text(b,'title'),link:text(b,'link'),date,source:text(b,'source'),ts:Date.parse(date)||0};
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
function parseSocialFeed(xml,source){
 const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
 return items.map(m=>{
  const b=m[1];
  const date=text(b,'pubDate')||text(b,'dc:date');
  const title=cleanHtml(text(b,'title'));
  const desc=cleanHtml(text(b,'description'));
  const encoded=cleanHtml(text(b,'content:encoded'));
  let body=[encoded,desc,title].sort((a,b)=>b.length-a.length)[0]||'';
  body=body.replace(/^RT by @?[^:]+:\s*/i,'').replace(/^RT @?[^:]+:\s*/i,'').trim();
  const rawLink=text(b,'link')||text(b,'guid');
  const status=rawLink.match(/\/status\/(\d+)/)?.[1];
  const link=status?`https://x.com/${source.handle}/status/${status}`:`https://x.com/${source.handle}`;
  return {source:source.name,handle:source.handle,body,date,ts:Date.parse(date)||0,link};
 }).filter(p=>p.body&&(source.official||/\b(juventus|juve)\b/i.test(p.body))).slice(0,12);
}
function formatDate(value){
 try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return ''}
}
async function fetchText(url,timeout=1900){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeout);
 try{
  const r=await fetch(url,{cache:'no-store',signal:controller.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0 (compatible; JUMP-PRESS/1.0)','Accept':'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5'}});
  if(!r.ok) throw new Error(`http ${r.status}`);
  const body=await r.text();
  if(!body.includes('<item>')) throw new Error('empty feed');
  return body;
 }finally{clearTimeout(timer)}
}
async function getSocialForSource(source){
 for(const base of RSSHUB_INSTANCES){
  try{
   const xml=await fetchText(`${base}/twitter/user/${source.handle}/exclude_replies`,1900);
   const posts=parseSocialFeed(xml,source);
   if(posts.length) return posts;
  }catch{}
 }
 try{
  const xml=await fetchText(`https://twiiit.com/${source.handle}/rss`,2400);
  return parseSocialFeed(xml,source);
 }catch{return []}
}
async function getSocialNews(){
 const groups=await Promise.all(SOCIAL_SOURCES.map(getSocialForSource));
 const seen=new Set();
 return groups.flat()
  .sort((a,b)=>b.ts-a.ts)
  .filter(p=>{
   const key=p.body.toLowerCase().replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();
   if(!key||seen.has(key)) return false;
   seen.add(key);
   return true;
  })
  .slice(0,40);
}
async function getNews(){
 try{
  const r=await fetch(FEED,{cache:'no-store',headers:{'User-Agent':'Mozilla/5.0'}});
  if(!r.ok) throw new Error('feed');
  return parseFeed(await r.text());
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
    <span>Solo post delle fonti selezionate che riguardano Juventus/Juve, ordinati dal più recente.</span>
   </section>
   <section className="socialfeed">
    {social.length?social.map((p,i)=><a className="socialpost" href={p.link} target="_blank" rel="noreferrer" key={`${p.link}-${i}`}>
     <div className="newsmeta"><b>X · {p.source}</b><span>{formatDate(p.date)}</span></div>
     <p className="socialtext">{p.body}</p>
     <span className="newsopen">Apri su X ↗</span>
    </a>):<div className="newsempty"><b>Nessun post Juventus recuperato in questo momento.</b><span>Premi Aggiorna: il radar riprova tutte le fonti live.</span></div>}
   </section>
  </>}

  <footer><b>JUMP PRESS</b> · News Juventus · <span>refresh automatico ogni 20 minuti</span></footer>
 </main>;
}
