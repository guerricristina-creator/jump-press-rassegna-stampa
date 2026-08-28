'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function LiveAppRefresh(){
  const router=useRouter();
  useEffect(()=>{
    let busy=false;
    const refresh=()=>{
      if(document.hidden||busy)return;
      busy=true;
      try{router.refresh()}finally{setTimeout(()=>{busy=false},1200)}
    };
    const id=setInterval(refresh,2*60*1000);
    const onVisible=()=>{if(document.visibilityState==='visible')refresh()};
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',onVisible);
    return()=>{
      clearInterval(id);
      window.removeEventListener('focus',refresh);
      document.removeEventListener('visibilitychange',onVisible);
    };
  },[router]);
  return null;
}
