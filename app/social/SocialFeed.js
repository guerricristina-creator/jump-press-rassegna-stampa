'use client';
import {useEffect,useMemo,useState} from 'react';

const STORAGE_KEY='jump_press_juve_social_last_good_v1';
function formatDate(value){try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return ''}}
function sortPosts(items=[]){return [...items].sort((a,b)=>(b.ts||Date.parse(b.date)||0)-(a.ts||Date.parse(a.date)||0));}
export default function SocialFeed(){
 const [posts,setPosts]=useState([]);
 const [fromCache,setFromCache]=useState(true);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed?.posts)&&parsed.posts.length)setPosts(sortPosts(parsed.posts));}}catch{}
  let alive=true;
  async function refresh(){
   try{const r=await fetch('/api/social-feed',{cache:'no-store'});if(!r.ok)throw new Error(String(r.status));const data=await r.json();if(alive&&Array.isArray(data?.posts)&&data.posts.length){const next=sortPosts(data.posts);setPosts(next);setFromCache(false);try{localStorage.setItem(STORAGE_KEY,JSON.stringify({savedAt:Date.now(),posts:next}));}catch{}}}catch{}finally{if(alive)setLoading(false)}
  }
  refresh();const id=setInterval(refresh,2*60*1000);return()=>{alive=false;clearInterval(id)};
 },[]);
 const latest=useMemo(()=>posts?.[0]?.date||null,[posts]);
 if(!posts.length)return <div className="empty"><b>{loading?'Caricamento social…':'Social in aggiornamento.'}</b><p>{loading?'La pagina è aperta: sto recuperando gli ultimi post in background.':'La fonte X non sta rispondendo. Riprovo automaticamente.'}</p></div>;
 return <>
  <div className="feedstatus">● {fromCache?'Ultimi social disponibili':'Aggiornato'}{latest?` · ${formatDate(latest)}`:''}{loading?' · aggiornamento in corso':''}</div>
  {posts.map((p,i)=><a className="post" href={p.link} target="_blank" rel="noreferrer" key={`${p.link}-${i}`}><div className="meta"><b>X · {p.source}</b><span>{formatDate(p.date)}</span></div><p>{p.body}</p><strong>Apri su X ↗</strong></a>)}
 </>;
}
