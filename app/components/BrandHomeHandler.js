'use client';
import {useEffect} from 'react';

export default function BrandHomeHandler(){
 useEffect(()=>{
  const prepare=()=>{
   document.querySelectorAll('.brand').forEach(el=>{
    el.setAttribute('role','link');
    el.setAttribute('tabindex','0');
    el.setAttribute('aria-label','Vai alla home JUMP PRESS');
   });
  };
  const goHome=(e)=>{
   const el=e.target.closest?.('.brand');
   if(!el) return;
   e.preventDefault();
   window.location.assign('/');
  };
  const onKey=(e)=>{
   const el=e.target.closest?.('.brand');
   if(!el || (e.key!=='Enter'&&e.key!==' ')) return;
   e.preventDefault();
   window.location.assign('/');
  };
  prepare();
  document.addEventListener('click',goHome,true);
  document.addEventListener('keydown',onKey,true);
  return ()=>{
   document.removeEventListener('click',goHome,true);
   document.removeEventListener('keydown',onKey,true);
  };
 },[]);
 return null;
}
