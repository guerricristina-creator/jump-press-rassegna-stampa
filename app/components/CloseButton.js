'use client';
import {useRouter} from 'next/navigation';
export default function CloseButton(){
 const router=useRouter();
 const close=()=>{
   if(window.history.length>1){router.back();setTimeout(()=>{if(window.location.pathname.startsWith('/ritaglio/')) router.push('/')},250)}
   else router.push('/');
 };
 return <button type="button" className="pdfclose" onClick={close} aria-label="Chiudi ritaglio e torna alla rassegna">×</button>;
}