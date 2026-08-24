'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
export default function PdfLinkHandler(){
 const router=useRouter();
 useEffect(()=>{
  const click=e=>{
   const a=e.target.closest('a');
   if(!a)return;
   const m=a.getAttribute('href')?.match(/^\/ritagli\/([^/]+)\.pdf$/);
   if(!m)return;
   e.preventDefault();
   router.push(`/ritaglio/${encodeURIComponent(m[1])}`);
  };
  document.addEventListener('click',click);
  return()=>document.removeEventListener('click',click);
 },[router]);
 return null;
}