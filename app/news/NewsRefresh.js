'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function NewsRefresh(){
 const router=useRouter();
 useEffect(()=>{
  const refresh=()=>router.refresh();
  const id=setInterval(refresh,5*60*1000);
  const onVisible=()=>{if(document.visibilityState==='visible') refresh();};
  window.addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',onVisible);
  return ()=>{
   clearInterval(id);
   window.removeEventListener('focus',refresh);
   document.removeEventListener('visibilitychange',onVisible);
  };
 },[router]);
 return null;
}
