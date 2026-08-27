import {unstable_cache} from 'next/cache';

export const dynamic='force-dynamic';

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

function relevantToJuve(body='',source={}){
 if(/\b(juventus|juve|bianconer\w*|allianz\s*stadium)\b/i.test(body)) return true;
 if(/\b(spalletti|yildiz|miretti|bremer|thuram|koopmeiners|cambiaso|vicario|di\s*gregorio|chiellini|comolli|kessi[eé]|sorloth|zirkzee|kolo\s*muani|david|muharemovi[cć]|martinez|thuram)\b/i.test(body)) return true;
 return Boolean(source.ardoino&&/\b(zebra|zebre|jay)\b/i.test(body));
}

function cleanMarkdown(s=''){
 return s
  .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g,' ')
  .replace(/!\[[^\]]*\]\([^)]*\)/g,' ')
  .replace(/\[([^\]]*)\]\([^)]*\)/g,'$1')
  .replace(/\[(?:)\]\([^)]*\)/g,' ')
  .replace(/\\([#_*`])/g,'$1')
  .replace(/\s+/g,' ')
  .replace(/(?:\s+\d+(?:\.\d+)?[KMB]?){2,8}\s*$/i,'')
  .trim();
}

function relativeDate(label=''){
 const now=Date.now();
 let m=label.match(/^(\d+)(s|m|h|d)$/i);
 if(m){
  const n=Number(m[1]);
  const mult={s:1000,m:60000,h:3600000,d:86400000}[m[2].toLowerCase()];
  return new Date(now-n*mult);
 }
 m=label.match(/^([A-Z][a-z]{2})\s+(\d{1,2})(?:,\s*(\d{4}))?$/);
 if(m){
  const year=m[3]?Number(m[3]):new Date().getUTCFullYear();
  const d=new Date(`${m[1]} ${m[2]}, ${year} 12:00:00 UTC`);
  if(!Number.isNaN(d.getTime())) return d;
 }
 m=label.match(/^([A-Z][a-z]{2})\s+(\d{1,2}),\s*(\d{4})$/);
 if(m){
  const d=new Date(`${m[1]} ${m[2]}, ${m[3]} 12:00:00 UTC`);
  if(!Number.isNaN(d.getTime())) return d;
 }
 return new Date(0);
}

function parseJinaX(text,source){
 const posts=[];
 const blocks=text.split(/\n(?=\*\s+)/g);
 for(const block of blocks){
  const statusRe=new RegExp(`\\[([^\\]]+)\\]\\(https:\\/\\/x\\.com\\/${source.handle}\\/status\\/(\\d+)\\)`,'i');
  const hit=block.match(statusRe);
  if(!hit) continue;
  const label=hit[1].trim();
  if(!/^(?:\d+[smhd]|[A-Z][a-z]{2}\s+\d{1,2}(?:,\s*\d{4})?)$/i.test(label)) continue;
  const status=hit[2];
  const after=block.slice((hit.index||0)+hit[0].length);
  const body=cleanMarkdown(after);
  if(!body) continue;
  const date=relativeDate(label);
  const ts=date.getTime();
  if(!ts) continue;
  if(!(source.official||source.allPosts||relevantToJuve(body,source))) continue;
  posts.push({source:source.name,platform:'X',body,date:date.toISOString(),ts,link:`https://x.com/${source.handle}/status/${status}`});
 }
 return posts;
}

async function fetchJinaX(handle){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),10000);
 try{
  const r=await fetch(`https://r.jina.ai/https://x.com/${handle}`,{
   cache:'no-store',signal:controller.signal,redirect:'follow',
   headers:{'Accept':'text/plain','User-Agent':'Mozilla/5.0'}
  });
  if(!r.ok) throw new Error(`jina ${r.status}`);
  const text=await r.text();
  if(!/Markdown Content:/i.test(text)||!/status\//i.test(text)) throw new Error('empty X profile');
  return text;
 }finally{clearTimeout(timer)}
}

const getCachedJinaX=unstable_cache(
 async handle=>fetchJinaX(handle),
 ['jump-press-jina-x-social-v1'],
 {revalidate:300}
);

async function getXForSource(source){
 try{return parseJinaX(await getCachedJinaX(source.handle),source).slice(0,source.allPosts?20:8);}
 catch{return []}
}

function dedupePosts(posts=[]){
 const seen=new Set();
 return posts.sort((a,b)=>b.ts-a.ts).filter(p=>{
  const key=p.link||p.body.toLowerCase().replace(/\s+/g,' ').trim();
  if(!key||seen.has(key)) return false;
  seen.add(key);
  return true;
 });
}

async function getSocialNews(){
 const settled=await Promise.allSettled(SOCIAL_SOURCES.map(getXForSource));
 const groups=settled.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);
 const cutoff=Date.now()-SOCIAL_MAX_AGE;
 const counts=new Map();
 return dedupePosts(groups.flat()).filter(p=>p.ts>=cutoff).filter(p=>{
  const max=p.source==='Calcio e Finanza'?20:(p.source==='Juventus'?5:7);
  const n=counts.get(p.source)||0;
  if(n>=max) return false;
  counts.set(p.source,n+1);
  return true;
 });
}

function formatDate(value){
 try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
 catch{return ''}
}

export default async function SocialPage(){
 const social=await getSocialNews();
 return <main style={{maxWidth:980,margin:'0 auto',padding:'54px 24px 40px',fontFamily:'Arial,Helvetica,sans-serif'}}>
  <header style={{color:'#f4f4f4',paddingBottom:20}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:40}}><div style={{fontWeight:900,letterSpacing:2,fontSize:20}}>JUMP PRESS</div><a href="/news" style={{color:'#fff',textDecoration:'none',border:'1px solid #555',borderRadius:999,padding:'10px 14px',fontWeight:800}}>← Indietro</a></div>
   <small style={{color:'#dfff2f',letterSpacing:2,fontWeight:800}}>NEWS</small>
   <h1 style={{fontSize:64,lineHeight:.95,margin:'18px 0 25px',letterSpacing:-2.5}}>Juventus <span style={{color:'#d6d6d6'}}>social</span></h1>
   <p style={{fontSize:18,lineHeight:1.6,color:'#e3e3e3'}}>Aggiornamenti X da fonti selezionate, filtrati sulla Juventus.</p>
   <div style={{display:'flex',gap:12,marginTop:26}}><a href="/news" style={{color:'#fff',textDecoration:'none',border:'1px solid #555',borderRadius:999,padding:'12px 28px',fontWeight:900}}>WEB</a><span style={{background:'#dfff2f',color:'#111',borderRadius:999,padding:'12px 28px',fontWeight:900}}>SOCIAL</span></div>
  </header>
  <section style={{background:'#f3f2ef',borderRadius:24,padding:'26px 0 10px',marginTop:32}}>
   {social.length?social.map((p,i)=><a href={p.link} target="_blank" rel="noreferrer" key={`${p.link}-${i}`} style={{display:'block',margin:'0 24px 14px',padding:'22px',background:'#fff',border:'1px solid #ddd',borderRadius:18,color:'#111',textDecoration:'none'}}><div style={{display:'flex',justifyContent:'space-between',gap:15,fontSize:13,color:'#666'}}><b style={{color:'#111'}}>{p.platform} · {p.source}</b><span>{formatDate(p.date)}</span></div><p style={{fontSize:17,lineHeight:1.5,margin:'14px 0 8px'}}>{p.body}</p><b style={{fontSize:13}}>Apri su X ↗</b></a>):<div style={{margin:'0 24px 14px',padding:'28px',background:'#fff',border:'1px solid #ddd',borderRadius:18}}><b style={{fontSize:24}}>Feed social temporaneamente non raggiungibile.</b><p style={{color:'#666'}}>Il recupero dei profili X non ha restituito post utilizzabili.</p></div>}
  </section>
 </main>;
}
