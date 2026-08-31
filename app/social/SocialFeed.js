'use client';
import {useEffect,useMemo,useState,useCallback,useRef} from 'react';

const STORAGE_KEY='jump_press_juve_social_last_good_v1';
const JUVE_QUERY='(Juventus OR Juve OR bianconeri OR Continassa)';
const X_SEARCHES=[
 {label:'Tutte le fonti',accounts:['SkySport','tuttosport','Gazzetta_it','CorSport','sportmediaset','DiMarzio','FabrizioRomano','NicoSchira','romeoagresti','GiovaAlbanese','AlfredoPedulla','TuttoMercatoWeb','cmdotcom','GoalItalia','Glongari','CronacheTweet','ocwsport','MCriscitiello']},
 {label:'Giornalisti / mercato',accounts:['DiMarzio','FabrizioRomano','NicoSchira','romeoagresti','GiovaAlbanese','AlfredoPedulla','Glongari','MCriscitiello','nicolabalice','filippocornacchia','fabdellavalle','marcoconterio','86_longo']},
 {label:'Testate',accounts:['SkySport','tuttosport','Gazzetta_it','CorSport','sportmediaset','TuttoMercatoWeb','cmdotcom','GoalItalia','CronacheTweet','ocwsport']}
];
function xSearchUrl(accounts){const authors=accounts.map(h=>`from:${h}`).join(' OR ');return `https://x.com/search?q=${encodeURIComponent(`${JUVE_QUERY} (${authors})`)}&src=typed_query&f=live`;}
function formatDate(value){try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value)).replace(',',' ·');}catch{return ''}}
function sortPosts(items=[]){return [...items].sort((a,b)=>(b.ts||Date.parse(b.date)||0)-(a.ts||Date.parse(a.date)||0));}
function mergePosts(...groups){const seen=new Set();return sortPosts(groups.flat().filter(Boolean)).filter(p=>{const k=p.link||`${p.source}-${p.body}`;if(!k||seen.has(k))return false;seen.add(k);return true;});}
function cleanBody(value=''){
 return String(value)
  .replace(/https?:\/\/(?:www\.)?(?:nitter\.cf|xcancel\.com)(?::\d+)?\/t\.co\/\S+/gi,'')
  .replace(/https?:\/\/(?:www\.)?(?:nitter\.cf|xcancel\.com)(?::\d+)?\/[^\s]+/gi,'')
  .replace(/https?:\/\/t\.co\/\S+/gi,'')
  .replace(/\s{2,}/g,' ')
  .trim();
}
function XSearchPanel(){return <div style={{margin:'0 0 14px',padding:'12px',border:'1px solid #d9d9d9',borderRadius:'12px',background:'#fff'}}>
 <div style={{fontWeight:800,marginBottom:'4px'}}>Ricerca live su X</div>
 <div style={{fontSize:'13px',lineHeight:1.35,opacity:.72,marginBottom:'10px'}}>Apre gli ultimi post su Juventus/Juve solo dagli account selezionati.</div>
 <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
  {X_SEARCHES.map(s=><a key={s.label} href={xSearchUrl(s.accounts)} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',minHeight:'40px',padding:'0 12px',borderRadius:'10px',border:'1px solid #111',fontWeight:700,textDecoration:'none',color:'inherit',background:'#fff'}}>{s.label} ↗</a>)}
 </div>
</div>}
export default function SocialFeed({initialPosts=[]}){
 const seed=useMemo(()=>sortPosts(Array.isArray(initialPosts)?initialPosts:[]),[initialPosts]);
 const [posts,setPosts]=useState(seed);
 const [fromCache,setFromCache]=useState(!seed.length);
 const [loading,setLoading]=useState(!seed.length);
 const [failed,setFailed]=useState(false);
 const mounted=useRef(true);
 const busy=useRef(false);
 const controllerRef=useRef(null);
 const refresh=useCallback(async()=>{
  if(busy.current)return;
  busy.current=true;
  setFailed(false);
  if(!posts.length)setLoading(true);
  const controller=new AbortController();
  controllerRef.current=controller;
  const timeout=setTimeout(()=>controller.abort(),25000);
  try{
   const stamp=Date.now();
   const [mainRes,searchRes]=await Promise.allSettled([
    fetch('/api/social-feed?fresh='+stamp,{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}}).then(async r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}),
    fetch('/api/social-search?fresh='+stamp,{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}}).then(async r=>{if(!r.ok)throw new Error(String(r.status));return r.json()})
   ]);
   const main=mainRes.status==='fulfilled'&&Array.isArray(mainRes.value?.posts)?mainRes.value.posts:[];
   const extra=searchRes.status==='fulfilled'&&Array.isArray(searchRes.value?.posts)?searchRes.value.posts:[];
   if(!mounted.current)return;
   setPosts(current=>{
    const next=mergePosts(current,main,extra).slice(0,300);
    if(!next.length)return current;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({savedAt:Date.now(),posts:next}));}catch{}
    return next;
   });
   setFromCache(false);setFailed(false);
  }catch{
   if(mounted.current)setFailed(true);
  }finally{
   clearTimeout(timeout);
   if(controllerRef.current===controller)controllerRef.current=null;
   busy.current=false;
   if(mounted.current)setLoading(false);
  }
 },[posts.length]);
 useEffect(()=>{
  mounted.current=true;
  if(!seed.length){
   try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed?.posts)&&parsed.posts.length)setPosts(sortPosts(parsed.posts));}}catch{}
  }
  const first=setTimeout(()=>{if(document.visibilityState==='visible')refresh()},300);
  const id=setInterval(()=>{if(document.visibilityState==='visible')refresh()},60*1000);
  const manual=()=>refresh();
  const visible=()=>{if(document.visibilityState==='visible')refresh()};
  window.addEventListener('jump-social-refresh',manual);
  document.addEventListener('visibilitychange',visible);
  return()=>{mounted.current=false;clearTimeout(first);clearInterval(id);controllerRef.current?.abort();window.removeEventListener('jump-social-refresh',manual);document.removeEventListener('visibilitychange',visible)};
 },[refresh,seed.length]);
 const latest=useMemo(()=>posts?.[0]?.date||null,[posts]);
 if(!posts.length)return <><XSearchPanel/><div className="empty"><b>{loading?'Caricamento social…':'Social temporaneamente non raggiungibili.'}</b><p>{loading?'Sto recuperando gli ultimi post dalle fonti selezionate.':'Usa intanto la ricerca live su X qui sopra: è gratuita e filtrata sulle fonti selezionate.'}</p></div></>;
 return <>
  <XSearchPanel/>
  <div className="feedstatus">● {fromCache?'Ultimi social disponibili':'Aggiornato'}{latest?` · ${formatDate(latest)}`:''}{failed?' · rete social momentaneamente lenta':''}</div>
  {posts.map((p,i)=><a className="post" href={p.link} target="_blank" rel="noreferrer" key={`${p.link}-${i}`}><div className="meta"><b>X · {p.source}</b><span>{formatDate(p.date)||'Data e ora non disponibili'}</span></div><p>{cleanBody(p.body)}</p><strong>Apri su X ↗</strong></a>)}
 </>;
}
