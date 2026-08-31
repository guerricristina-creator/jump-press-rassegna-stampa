'use client';
import {useEffect,useMemo,useState,useCallback,useRef} from 'react';

const STORAGE_KEY='jump_press_juve_social_last_good_v1';
function formatDate(value){try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value)).replace(',',' ·');}catch{return ''}}
function sortPosts(items=[]){return [...items].sort((a,b)=>(b.ts||Date.parse(b.date)||0)-(a.ts||Date.parse(a.date)||0));}
function cleanBody(value=''){
 return String(value)
  .replace(/https?:\/\/(?:www\.)?(?:nitter\.cf|xcancel\.com)(?::\d+)?\/t\.co\/\S+/gi,'')
  .replace(/https?:\/\/(?:www\.)?(?:nitter\.cf|xcancel\.com)(?::\d+)?\/[^\s]+/gi,'')
  .replace(/https?:\/\/t\.co\/\S+/gi,'')
  .replace(/\s{2,}/g,' ')
  .trim();
}
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
   const r=await fetch('/api/social-feed?fresh='+Date.now(),{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
   if(!r.ok)throw new Error(String(r.status));
   const data=await r.json();
   if(!Array.isArray(data?.posts)||!data.posts.length)throw new Error('empty');
   const next=sortPosts(data.posts);
   if(!mounted.current)return;
   setPosts(next);setFromCache(false);setFailed(false);
   try{localStorage.setItem(STORAGE_KEY,JSON.stringify({savedAt:Date.now(),posts:next}));}catch{}
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
  const id=setInterval(()=>{if(document.visibilityState==='visible')refresh()},2*60*1000);
  const manual=()=>refresh();
  const visible=()=>{if(document.visibilityState==='visible')refresh()};
  window.addEventListener('jump-social-refresh',manual);
  document.addEventListener('visibilitychange',visible);
  return()=>{mounted.current=false;clearTimeout(first);clearInterval(id);controllerRef.current?.abort();window.removeEventListener('jump-social-refresh',manual);document.removeEventListener('visibilitychange',visible)};
 },[refresh,seed.length]);
 const latest=useMemo(()=>posts?.[0]?.date||null,[posts]);
 if(!posts.length)return <div className="empty"><b>{loading?'Caricamento social…':'Social temporaneamente non raggiungibili.'}</b><p>{loading?'Sto recuperando gli ultimi post dalle fonti selezionate.':'Riprovo automaticamente senza cancellare gli ultimi risultati validi.'}</p></div>;
 return <>
  <div className="feedstatus">● {fromCache?'Ultimi social disponibili':'Aggiornato'}{latest?` · ${formatDate(latest)}`:''}{failed?' · rete social momentaneamente lenta':''}</div>
  {posts.map((p,i)=><a className="post" href={p.link} target="_blank" rel="noreferrer" key={`${p.link}-${i}`}><div className="meta"><b>X · {p.source}</b><span>{formatDate(p.date)||'Data e ora non disponibili'}</span></div><p>{cleanBody(p.body)}</p><strong>Apri su X ↗</strong></a>)}
 </>;
}
