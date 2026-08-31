'use client';
import {useEffect,useMemo,useState,useCallback,useRef} from 'react';

const STORAGE_KEY='jump_press_juve_social_last_good_v1';
const JOURNALISTS=new Set(['Gianluca Di Marzio','Fabrizio Romano','Nicolò Schira','Romeo Agresti','Giovanni Albanese','Alfredo Pedullà','Gianluigi Longari','Michele Criscitiello','Nicola Balice','Filippo Cornacchia','Fabiana Della Valle','Marco Conterio','Daniele Longo','Matteo Moretto','Fabrizio Biasin']);
const OUTLETS=new Set(['Sky Sport','Tuttosport','La Gazzetta dello Sport','Corriere dello Sport','Sport Mediaset','Tuttomercatoweb','Calciomercato.com','Goal Italia','Cronache di Spogliatoio','OCW Sport','Football Italia','Calcio e Finanza','JuventusNews24','TuttoJuve','IlBianconero']);
const RELEVANT=/(?:\bjuventus\b|\bjuve\b|\bbianconer\w*\b|\bcontinassa\b|@juventusfc\b|@juventus\b|\bvecchia signora\b)/i;

function formatDate(value){try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value)).replace(',',' ·');}catch{return ''}}
function sortPosts(items=[]){return [...items].sort((a,b)=>(b.ts||Date.parse(b.date)||0)-(a.ts||Date.parse(a.date)||0));}
function mergePosts(...groups){const seen=new Set();return sortPosts(groups.flat().filter(Boolean)).filter(p=>{const k=p.link||`${p.source}-${p.body}`;if(!k||seen.has(k))return false;seen.add(k);return true;});}
function cleanBody(value=''){return String(value).replace(/https?:\/\/(?:www\.)?(?:nitter\.cf|xcancel\.com)(?::\d+)?\/t\.co\/\S+/gi,'').replace(/https?:\/\/(?:www\.)?(?:nitter\.cf|xcancel\.com)(?::\d+)?\/[^\s]+/gi,'').replace(/https?:\/\/t\.co\/\S+/gi,'').replace(/\s{2,}/g,' ').trim();}

export default function SocialFeed({initialPosts=[]}){
 const seed=useMemo(()=>sortPosts(Array.isArray(initialPosts)?initialPosts:[]),[initialPosts]);
 const [posts,setPosts]=useState(seed);
 const [fromCache,setFromCache]=useState(!seed.length);
 const [loading,setLoading]=useState(!seed.length);
 const [failed,setFailed]=useState(false);
 const [filter,setFilter]=useState('all');
 const [onlyJuve,setOnlyJuve]=useState(true);
 const [visibleCount,setVisibleCount]=useState(40);
 const mounted=useRef(true);
 const busy=useRef(false);
 const controllerRef=useRef(null);

 const refresh=useCallback(async()=>{
  if(busy.current)return;
  busy.current=true;setFailed(false);
  if(!posts.length)setLoading(true);
  const controller=new AbortController();controllerRef.current=controller;
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
    const next=mergePosts(current,main,extra).slice(0,500);
    if(!next.length)return current;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({savedAt:Date.now(),posts:next}));}catch{}
    return next;
   });
   setFromCache(false);setFailed(false);
  }catch{if(mounted.current)setFailed(true)}finally{
   clearTimeout(timeout);if(controllerRef.current===controller)controllerRef.current=null;busy.current=false;if(mounted.current)setLoading(false);
  }
 },[posts.length]);

 useEffect(()=>{
  mounted.current=true;
  if(!seed.length){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed?.posts)&&parsed.posts.length)setPosts(sortPosts(parsed.posts));}}catch{}}
  const first=setTimeout(()=>{if(document.visibilityState==='visible')refresh()},300);
  const id=setInterval(()=>{if(document.visibilityState==='visible')refresh()},60*1000);
  const manual=()=>refresh();const visible=()=>{if(document.visibilityState==='visible')refresh()};
  window.addEventListener('jump-social-refresh',manual);document.addEventListener('visibilitychange',visible);
  return()=>{mounted.current=false;clearTimeout(first);clearInterval(id);controllerRef.current?.abort();window.removeEventListener('jump-social-refresh',manual);document.removeEventListener('visibilitychange',visible)};
 },[refresh,seed.length]);

 const filtered=useMemo(()=>posts.filter(p=>{
  const body=cleanBody(p.body||'');
  if(onlyJuve&&p.source!=='Juventus'&&!RELEVANT.test(body))return false;
  if(filter==='journalists')return JOURNALISTS.has(p.source);
  if(filter==='outlets')return OUTLETS.has(p.source);
  return true;
 }),[posts,filter,onlyJuve]);
 const shown=filtered.slice(0,visibleCount);
 const latest=filtered?.[0]?.date||posts?.[0]?.date||null;

 return <div className="socialShell">
  <section className="socialToolbar">
   <div className="socialToolbarCopy"><b>Ricerca live su X</b><span>Post su Juventus/Juve dalle fonti selezionate, mostrati direttamente qui.</span></div>
   <div className="socialToolbarStatus"><span>● {fromCache?'Ultimi social disponibili':'Aggiornato'}{latest?` · ${formatDate(latest)}`:''}</span><b>{filtered.length} post disponibili</b></div>
   <div className="socialFilters">
    <button className={filter==='all'?'active':''} onClick={()=>{setFilter('all');setVisibleCount(40)}}>Tutte le fonti</button>
    <button className={filter==='journalists'?'active':''} onClick={()=>{setFilter('journalists');setVisibleCount(40)}}>Giornalisti / mercato</button>
    <button className={filter==='outlets'?'active':''} onClick={()=>{setFilter('outlets');setVisibleCount(40)}}>Testate</button>
    <label className="juveOnly"><input type="checkbox" checked={onlyJuve} onChange={e=>setOnlyJuve(e.target.checked)}/><span>Solo Juventus/Juve</span></label>
   </div>
  </section>

  {failed&&<div className="socialWarning">La rete social è momentaneamente lenta: mantengo i risultati già recuperati.</div>}
  {!shown.length?<div className="socialEmpty"><b>{loading?'Caricamento social…':'Nessun post disponibile con questi filtri.'}</b><span>{loading?'Sto recuperando gli ultimi post dalle fonti selezionate.':'Prova Tutte le fonti oppure disattiva il filtro Juventus/Juve.'}</span></div>:
   <div className="socialGrid">{shown.map((p,i)=><a className="socialCard" href={p.link} target="_blank" rel="noreferrer" key={`${p.link}-${i}`}>
    <div className="socialMeta"><b>X · {p.source}</b><time>{formatDate(p.date)||'Data e ora non disponibili'}</time></div>
    <p>{cleanBody(p.body)}</p>
    <strong>Apri su X ↗</strong>
   </a>)}</div>}
  {visibleCount<filtered.length&&<div className="socialMore"><button onClick={()=>setVisibleCount(v=>v+40)}>Mostra altri post</button></div>}
 </div>;
}
