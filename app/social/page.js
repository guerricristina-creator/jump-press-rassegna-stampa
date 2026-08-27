import {unstable_cache} from 'next/cache';

export const dynamic='force-dynamic';

const X_FEED_BASES=[
 'https://rsshub.isrss.com',
 'https://rsshub.cinte.cc',
 'https://rsshub.stsecurity.moe',
 'https://rsshub.rssforever.com'
];
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
 {name:'Corriere dello Sport',handle:'CorSport'},
 {name:'Sport Mediaset',handle:'sportmediaset'},
 {name:'Sky Sport',handle:'SkySport'},
 {name:'ilBiancoNero',handle:'ilbianconerocom'},
 {name:'Fanpage.it',handle:'fanpage'},
 {name:'Calcio Totale',handle:'calcio_morelli'},
 {name:'Calcio e Finanza',handle:'CalcioFinanza',allPosts:true},
 {name:'Paolo Ardoino',handle:'paoloardoino',ardoino:true}
];

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
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
 return decodeXml(value).replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]+>/g,' ').replace(/https?:\/\/t\.co\/\S+/gi,'').replace(/\s+/g,' ').trim();
}
function relevantToJuve(body='',source={}){
 if(/\b(juventus|juve|bianconer\w*|allianz\s*stadium)\b/i.test(body)) return true;
 if(/\b(spalletti|yildiz|miretti|bremer|thuram|koopmeiners|cambiaso|vicario|di\s*gregorio|chiellini|comolli|kessi[eé]|sorloth|zirkzee|kolo\s*muani)\b/i.test(body)) return true;
 return Boolean(source.ardoino&&/\b(zebra|zebre|jay)\b/i.test(body));
}
function parseXFeed(xml,source){
 return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m=>{
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
 }).filter(p=>p.body&&(source.official||source.allPosts||relevantToJuve(p.body,source)));
}
function formatDate(value){
 try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return ''}
}
async function fetchXXml(handle){
 let lastError=null;
 for(const base of X_FEED_BASES){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),4500);
  try{
   const r=await fetch(`${base}/twitter/user/${handle}/exclude_replies`,{cache:'no-store',signal:controller.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5'}});
   if(!r.ok) throw new Error(`http ${r.status}`);
   const xml=await r.text();
   if(!/<item>/i.test(xml)) throw new Error('empty feed');
   return xml;
  }catch(e){lastError=e}
  finally{clearTimeout(timer)}
 }
 throw lastError||new Error('feed unavailable');
}
const getCachedXXml=unstable_cache(async handle=>fetchXXml(handle),['jump-social-resilient-x-v1'],{revalidate:300});
async function getXForSource(source){
 try{return parseXFeed(await getCachedXXml(source.handle),source).slice(0,source.allPosts?30:12);}catch{return []}
}
function dedupePosts(posts=[]){
 const seen=new Set();
 return posts.sort((a,b)=>b.ts-a.ts).filter(p=>{const key=p.body.toLowerCase().replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();if(!key||seen.has(key))return false;seen.add(key);return true;});
}
async function getSocialNews(){
 const groups=[];
 for(let i=0;i<SOCIAL_SOURCES.length;i+=2){
  const settled=await Promise.allSettled(SOCIAL_SOURCES.slice(i,i+2).map(getXForSource));
  for(const r of settled) if(r.status==='fulfilled') groups.push(r.value);
  if(i+2<SOCIAL_SOURCES.length) await sleep(100);
 }
 const cutoff=Date.now()-SOCIAL_MAX_AGE;
 const counts=new Map();
 return dedupePosts(groups.flat()).filter(p=>p.ts>=cutoff).filter(p=>{
  const max=p.source==='Calcio e Finanza'?20:(p.source==='Juventus'?4:7);
  const n=counts.get(p.source)||0;
  if(n>=max)return false;
  counts.set(p.source,n+1);
  return true;
 });
}

export default async function SocialPage(){
 const social=await getSocialNews();
 return <main style={{maxWidth:980,margin:'0 auto',padding:'54px 24px 40px',fontFamily:'Arial,Helvetica,sans-serif'}}>
  <header style={{color:'#f4f4f4',paddingBottom:20}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:40}}><div style={{fontWeight:900,letterSpacing:2,fontSize:20}}>JUMP PRESS</div><a href="/news" style={{color:'#fff',textDecoration:'none',border:'1px solid #555',borderRadius:999,padding:'10px 14px',fontWeight:800}}>← Indietro</a></div>
   <small style={{color:'#dfff2f',letterSpacing:2,fontWeight:800}}>NEWS</small>
   <h1 style={{fontSize:64,lineHeight:.95,margin:'18px 0 25px',letterSpacing:-2.5}}>Juventus <span style={{color:'#d6d6d6'}}>social</span></h1>
   <p style={{fontSize:18,lineHeight:1.6,color:'#e3e3e3'}}>Aggiornamenti X da fonti selezionate sulla Juventus. Il feed usa più server di riserva per evitare blocchi quando una singola fonte RSS non risponde.</p>
   <div style={{display:'flex',gap:12,marginTop:26}}><a href="/news" style={{color:'#fff',textDecoration:'none',border:'1px solid #555',borderRadius:999,padding:'12px 28px',fontWeight:900}}>WEB</a><span style={{background:'#dfff2f',color:'#111',borderRadius:999,padding:'12px 28px',fontWeight:900}}>SOCIAL</span></div>
  </header>
  <section style={{background:'#f3f2ef',borderRadius:24,padding:'26px 0 10px',marginTop:32}}>
   {social.length?social.map((p,i)=><a href={p.link} target="_blank" rel="noreferrer" key={`${p.link}-${i}`} style={{display:'block',margin:'0 24px 14px',padding:'22px',background:'#fff',border:'1px solid #ddd',borderRadius:18,color:'#111',textDecoration:'none'}}><div style={{display:'flex',justifyContent:'space-between',gap:15,fontSize:13,color:'#666'}}><b style={{color:'#111'}}>{p.platform} · {p.source}</b><span>{formatDate(p.date)}</span></div><p style={{fontSize:17,lineHeight:1.5,margin:'14px 0 8px'}}>{p.body}</p><b style={{fontSize:13}}>Apri su X ↗</b></a>):<div style={{margin:'0 24px 14px',padding:'28px',background:'#fff',border:'1px solid #ddd',borderRadius:18}}><b style={{fontSize:24}}>Feed social temporaneamente non raggiungibile.</b><p style={{color:'#666'}}>Sto interrogando più server di riserva; riprova con Aggiorna tra poco.</p></div>}
  </section>
 </main>;
}
