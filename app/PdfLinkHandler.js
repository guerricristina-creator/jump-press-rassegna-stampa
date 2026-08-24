'use client';
import {useEffect} from 'react';
export default function PdfLinkHandler(){
 useEffect(()=>{
  const prepare=()=>{
   document.querySelectorAll('a[href^="/ritagli/"][href$=".pdf"]').forEach(a=>{
    const href=a.getAttribute('href');
    const m=href&&href.match(/^\/ritagli\/([^/]+)\.pdf$/);
    if(m){
      a.setAttribute('href',`/ritaglio/${encodeURIComponent(m[1])}`);
      a.removeAttribute('target');
      a.removeAttribute('rel');
    }
   });
  };
  prepare();
  const observer=new MutationObserver(prepare);
  observer.observe(document.body,{childList:true,subtree:true});
  return()=>observer.disconnect();
 },[]);
 return null;
}