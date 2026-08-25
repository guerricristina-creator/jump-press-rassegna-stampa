'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

// social radar deploy marker v2
export default function NewsRefresh(){
 const router=useRouter();
 useEffect(()=>{
  const id=setInterval(()=>router.refresh(),20*60*1000);
  return ()=>clearInterval(id);
 },[router]);
 return null;
}
