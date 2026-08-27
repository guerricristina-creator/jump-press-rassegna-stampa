'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function SocialRefresh(){
 const router=useRouter();
 useEffect(()=>{
  const id=setInterval(()=>router.refresh(),2*60*1000);
  return ()=>clearInterval(id);
 },[router]);
 return null;
}
