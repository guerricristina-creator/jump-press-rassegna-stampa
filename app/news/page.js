import NewsRefresh from './NewsRefresh';

export const dynamic='force-dynamic';

const NEWS_QUERIES=[
 'Juventus',
 'Juventus calcio',
 'Juventus ultime notizie',
 'Juventus calciomercato',
 'mercato Juventus',
 'Juventus Spalletti',
 'Juventus Comolli',
 'Juventus Chiellini',
 'Juventus Yildiz',
 'Juventus Kessie',
 'Juventus Sorloth',
 'Juventus Zirkzee',
 'Juventus Mateta',
 'Juventus David',
 'Juventus Miretti',
 'Juventus Bremer',
 'Juventus Koopmeiners',
 'Juventus Cambiaso',
 'Juventus Next Gen',
 'Juventus Women',
 'Juventus Primavera',
 'Juventus Gazzetta dello Sport',
 'Juventus Tuttosport',
 'Juventus Corriere dello Sport',
 'Juventus Sky Sport',
 'Juventus Sport Mediaset',
 'Juventus Tuttomercatoweb',
 'Juventus Gianluca Di Marzio',
 'Juventus Romeo Agresti',
 'Juventus Nicolò Schira',
 'Juventus Fabrizio Romano'
];
const FEEDS=NEWS_QUERIES.map(q=>`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=it&gl=IT&ceid=IT:it`);

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
function parseNewsFeed(xml){
 return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m=>{
  const b=m[1],date=xmlText(b,'pubDate');
  return {title:xmlText(b,'title'),link:xmlText(b,'link'),date,source:xmlText(b,'source'),ts:Date.parse(date)||0};
 }).filter(x=>x.title&&x.link);
}
function normalizeTitle(s=''){
 return s.toLowerCase().replace(/\s+-\s+[^-]+$/,'').replace(/[“”"'’.,:;!?()[\]{}]/g,'').replace(/\s+/g,' ').trim();
}
function dedupeNews(items=[]){
 const seen=new Set();
 return items.sort((a,b)=>b.ts-a.ts).filter(x=>{
  const key=normalizeTitle(x.title);
  if(!key||seen.has(key))return false;
  seen.add(key);return true;
 }).slice(0,150);
}
function formatDate(value){
 try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
 catch{return ''}
}
async function getNews(){
 const settled=await Promise.allSettled(FEEDS.map(async feed=>{
  const c=new AbortController(),t=setTimeout(()=>c.abort(),6000);
  try{
   const r=await fetch(feed,{cache:'no-store',signal:c.signal,headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5'}});
   if(!r.ok)throw new Error(`feed ${r.status}`);
   return parseNewsFeed(await r.text());
  }finally{clearTimeout(t)}
 }));
 return dedupeNews(settled.flatMap(r=>r.status==='fulfilled'?r.value:[]));
}

export default async function NewsPage(){
 const news=await getNews();
 return <main className="newspage">
  <NewsRefresh/>
  <header className="newsheader">
   <div className="top"><div className="brand"><i>JUMP</i> PRESS</div><div className="edition">JUVENTUS · NEWS LIVE</div></div>
   <small>NEWS</small>
   <h1>Juventus <em>news</em></h1>
   <p className="lead">Radar dedicato alla <b>Juventus</b>: notizie web, mercato, prima squadra, dirigenza, Next Gen, Women e settore giovanile dalle principali fonti.</p>
   <div className="newstabs"><a className="active" href="/news">WEB</a><a href="/social">SOCIAL</a></div>
   <div className="newsstatus"><span className="liveDot"/> Aggiornamento automatico · 2 min</div>
  </header>
  <section className="newslist">
   {news.length?news.map((n,i)=><a className="newscard" href={n.link} target="_blank" rel="noreferrer" key={`${n.link}-${i}`}>
    <div className="newsmeta"><b>{n.source||'Notizia'}</b><span>{formatDate(n.date)}</span></div>
    <h2>{n.title}</h2><span className="newsopen">Apri notizia ↗</span>
   </a>):<div className="newsempty"><b>Nessuna notizia disponibile in questo momento.</b><span>Premi Aggiorna: il feed viene interrogato senza cache.</span></div>}
  </section>
  <footer><b>JUMP PRESS</b> · News Juventus · <span>refresh automatico ogni 2 minuti</span></footer>
 </main>;
}
