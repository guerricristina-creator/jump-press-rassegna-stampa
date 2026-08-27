'use client';
import {useEffect,useMemo,useState} from 'react';

const STORAGE_KEY='jump_press_juve_social_last_good_v1';

function formatDate(value){
 try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
 catch{return ''}
}

export default function SocialFeed({livePosts=[]}){
 const [posts,setPosts]=useState(livePosts);
 const [fromCache,setFromCache]=useState(false);

 useEffect(()=>{
  if(Array.isArray(livePosts)&&livePosts.length){
   setPosts(livePosts);
   setFromCache(false);
   try{localStorage.setItem(STORAGE_KEY,JSON.stringify({savedAt:Date.now(),posts:livePosts}));}catch{}
   return;
  }
  try{
   const raw=localStorage.getItem(STORAGE_KEY);
   if(!raw)return;
   const parsed=JSON.parse(raw);
   if(Array.isArray(parsed?.posts)&&parsed.posts.length){setPosts(parsed.posts);setFromCache(true);}
  }catch{}
 },[livePosts]);

 const latest=useMemo(()=>posts?.[0]?.date||null,[posts]);

 if(!posts?.length)return <div className="empty"><b>Social in aggiornamento.</b><p>La fonte X non sta rispondendo. L'app continua a riprovare automaticamente.</p></div>;

 return <>
  <div className="feedstatus">● {fromCache?'Ultimi social disponibili':'Aggiornato'}{latest?` · ${formatDate(latest)}`:''}{fromCache?' · nuovo tentativo automatico ogni 2 min':''}</div>
  {posts.map((p,i)=><a className="post" href={p.link} target="_blank" rel="noreferrer" key={`${p.link}-${i}`}>
   <div className="meta"><b>X · {p.source}</b><span>{formatDate(p.date)}</span></div>
   <p>{p.body}</p>
   <strong>Apri su X ↗</strong>
  </a>)}
 </>;
}
