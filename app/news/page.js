import NewsRefresh from './NewsRefresh';

export const dynamic='force-dynamic';

const FEED='https://news.google.com/rss/search?q=Juventus&hl=it&gl=IT&ceid=IT:it';

const SOCIAL_SOURCES=[
 {name:'Juventus',level:'Prioritaria',x:'https://x.com/juventus',ig:'https://www.instagram.com/juventus/'},
 {name:'Gianluca Di Marzio',level:'Prioritaria',x:'https://x.com/DiMarzio',ig:'https://www.instagram.com/gianlucadimarzio/'},
 {name:'Fabrizio Romano',level:'Prioritaria',x:'https://x.com/FabrizioRomano',ig:'https://www.instagram.com/fabriziorom/'},
 {name:'Nicolò Schira',level:'Prioritaria',x:'https://x.com/NicoSchira'},
 {name:'Romeo Agresti',level:'Prioritaria',x:'https://x.com/romeoagresti'},
 {name:'Mirko Di Natale',level:'Prioritaria',x:'https://x.com/mirkodinatale'},
 {name:'Giovanni Albanese',level:'Prioritaria',x:'https://x.com/GiovaAlbanese'},
 {name:'IlBianconero',level:'Prioritaria',x:'https://x.com/ilbianconerocom'},
 {name:'TuttoJuve',level:'Utile',x:'https://x.com/Tuttojuve_com'},
 {name:'Tuttomercatoweb',level:'Utile',x:'https://x.com/TuttoMercatoWeb'},
 {name:'Alfredo Pedullà',level:'Utile',x:'https://x.com/AlfredoPedulla'},
 {name:'Sky Sport',level:'Utile',x:'https://x.com/SkySport'},
 {name:'Tuttosport',level:'Utile',x:'https://x.com/tuttosport'},
 {name:'La Gazzetta dello Sport',level:'Utile',x:'https://x.com/Gazzetta_it'},
 {name:'Calciomercato.com',level:'Utile',x:'https://x.com/Calciomercatoit'},
 {name:'Cronache di Spogliatoio',level:'Utile',x:'https://x.com/cronachedispoglia'}
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

export default async function NewsPage({searchParams}){
 const params=await searchParams;
 const tab=params?.tab==='social'?'social':'web';
 const news=tab==='web'?await getNews():[];
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
    <b>Fonti social selezionate</b>
    <span>Prima le fonti prioritarie, poi quelle utili. L’obiettivo è evitare fan account, duplicati e rumore.</span>
   </section>
   <section className="socialgrid">
    {SOCIAL_SOURCES.map(s=><div className="socialcard" key={s.name}>
     <div className="socialhead"><b>{s.name}</b><span>{s.level}</span></div>
     <div className="socialactions">
      {s.x&&<a href={s.x} target="_blank" rel="noreferrer">X ↗</a>}
      {s.ig&&<a href={s.ig} target="_blank" rel="noreferrer">Instagram ↗</a>}
     </div>
    </div>)}
   </section>
  </>}

  <footer><b>JUMP PRESS</b> · News Juventus · <span>refresh automatico ogni 20 minuti</span></footer>
 </main>;
}
