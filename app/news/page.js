import NewsRefresh from './NewsRefresh';

export const dynamic='force-dynamic';

const FEED='https://news.google.com/rss/search?q=Juventus&hl=it&gl=IT&ceid=IT:it';
const X_MIRROR='https://twstalker.com';

const SOCIAL_SOURCES=[
 {name:'Juventus',handle:'juventus',official:true,x:'https://x.com/juventus'},
 {name:'Gianluca Di Marzio',handle:'DiMarzio',x:'https://x.com/DiMarzio'},
 {name:'Fabrizio Romano',handle:'FabrizioRomano',x:'https://x.com/FabrizioRomano'},
 {name:'Nicolò Schira',handle:'NicoSchira',x:'https://x.com/NicoSchira'},
 {name:'Romeo Agresti',handle:'romeoagresti',x:'https://x.com/romeoagresti'},
 {name:'Mirko Di Natale',handle:'mirkodinatale',x:'https://x.com/mirkodinatale'},
 {name:'Giovanni Albanese',handle:'GiovaAlbanese',x:'https://x.com/GiovaAlbanese'},
 {name:'Gianluigi Longari',handle:'Glongari',x:'https://x.com/Glongari'},
 {name:'Tuttomercatoweb',handle:'TuttoMercatoWeb',x:'https://x.com/TuttoMercatoWeb'},
 {name:'Cronache di Spogliatoio',handle:'CronacheTweet',x:'https://x.com/CronacheTweet'}
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
  .replace(/\s+/g,' ')
  .trim();
}
function escapeReg(value=''){
 return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
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
function tweetTimestamp(id){
 try{return Number((BigInt(id)>>22n)+1288834974657n)}catch{return 0}
}
function parseSocialPage(html,source){
 const chunks=html.split(/<div class=["']activity-posts["']>/i).slice(1,30);
 const statusRe=new RegExp(`href=["']\\/${escapeReg(source.handle)}\\/status\\/(\\d+)["']`,'i');
 const posts=[];
 for(const chunk of chunks){
  const status=chunk.match(statusRe)?.[1];
  if(!status) continue;
  const raw=chunk.match(/<div class=["']activity-descp["']>\s*<p>([\s\S]*?)<\/p>/i)?.[1];
  const body=cleanHtml(raw||'');
  if(!body) continue;
  if(!source.official&&!/\b(juventus(?:fc)?|juve)\b/i.test(body)) continue;
  const ts=tweetTimestamp(status);
  if(!ts) continue;
  posts.push({source:source.name,body,date:new Date(ts).toISOString(),ts,link:`https://x.com/${source.handle}/status/${status}`});
  if(posts.length>=10) break;
 }
 return posts;
}
function formatDate(value){
 try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return ''}
}
async function getSocialForSource(source){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),6000);
 try{
  const r=await fetch(`${X_MIRROR}/${source.handle}`,{
   cache:'no-store',signal:controller.signal,redirect:'follow',
   headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/139 Safari/537.36','Accept':'text/html,application/xhtml+xml'}
  });
  if(!r.ok) return [];
  return parseSocialPage(await r.text(),source);
 }catch{return []}finally{clearTimeout(timer)}
}
async function getSocialNews(){
 const groups=await Promise.all(SOCIAL_SOURCES.map(getSocialForSource));
 const seen=new Set();
 return groups.flat().sort((a,b)=>b.ts-a.ts).filter(p=>{
  const key=p.body.toLowerCase().replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();
  if(seen.has(key)) return false;
  seen.add(key);
  return true;
 }).slice(0,40);
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
    <b>Ultimi aggiornamenti social sulla Juventus</b>
    <span>Post X delle fonti selezionate che parlano di Juventus/Juve, ordinati dal più recente.</span>
   </section>
   <section className="socialfeed">
    {social.length?social.map((p,i)=><a className="socialpost" href={p.link} target="_blank" rel="noreferrer" key={`${p.link}-${i}`}>
     <div className="newsmeta"><b>X · {p.source}</b><span>{formatDate(p.date)}</span></div>
     <p className="socialtext">{p.body}</p>
     <span className="newsopen">Apri post ↗</span>
    </a>):<div className="newsempty"><b>Nessun aggiornamento social disponibile adesso.</b><span>Il radar riprova automaticamente ogni 20 minuti.</span></div>}
   </section>
  </>}

  <footer><b>JUMP PRESS</b> · News Juventus · <span>refresh automatico ogni 20 minuti</span></footer>
 </main>;
}
