import NewsRefresh from './NewsRefresh';

export const dynamic='force-dynamic';

const FEED='https://news.google.com/rss/search?q=Juventus&hl=it&gl=IT&ceid=IT:it';

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
function formatDate(value){
 try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return ''}
}

async function getNews(){
 try{
  const r=await fetch(FEED,{cache:'no-store',headers:{'User-Agent':'Mozilla/5.0'}});
  if(!r.ok) throw new Error('feed');
  return parseFeed(await r.text());
 }catch{return []}
}

export default async function NewsPage(){
 const news=await getNews();
 return <main className="newspage">
  <NewsRefresh/>
  <header className="newsheader">
   <div className="top"><div className="brand"><i>JUMP</i> PRESS</div><div className="edition">JUVENTUS · NEWS LIVE</div></div>
   <small>NEWS</small>
   <h1>Juventus <em>news</em></h1>
   <p className="lead">Ricerca dedicata esclusivamente a <b>Juventus</b>. Le notizie più recenti vengono mostrate per prime e il feed si aggiorna automaticamente ogni 20 minuti.</p>
   <div className="newsstatus"><span className="liveDot"/> Aggiornamento automatico · 20 min</div>
  </header>
  <section className="newslist">
   {news.length?news.map((n,i)=><a className="newscard" href={n.link} target="_blank" rel="noreferrer" key={`${n.link}-${i}`}>
    <div className="newsmeta"><b>{n.source||'Notizia'}</b><span>{formatDate(n.date)}</span></div>
    <h2>{n.title}</h2>
    <span className="newsopen">Apri notizia ↗</span>
   </a>):<div className="newsempty"><b>Nessuna notizia disponibile in questo momento.</b><span>Il feed verrà riprovato automaticamente.</span></div>}
  </section>
  <footer><b>JUMP PRESS</b> · News Juventus · <span>refresh automatico ogni 20 minuti</span></footer>
 </main>;
}
