'use client';
import {useEffect} from 'react';
import {usePathname,useRouter} from 'next/navigation';

export default function BrandHomeHandler(){
 const pathname=usePathname();
 const router=useRouter();
 useEffect(()=>{
  const brands=[...document.querySelectorAll('.brand')];
  const cleanups=brands.map(el=>{
   const goHome=(e)=>{e.preventDefault();router.push('/')};
   const onKey=(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();router.push('/')}};
   el.setAttribute('role','link');
   el.setAttribute('tabindex','0');
   el.setAttribute('aria-label','Vai alla home JUMP PRESS');
   el.addEventListener('click',goHome);
   el.addEventListener('keydown',onKey);
   return ()=>{el.removeEventListener('click',goHome);el.removeEventListener('keydown',onKey)};
  });
  return ()=>cleanups.forEach(fn=>fn());
 },[pathname,router]);
 return null;
}
