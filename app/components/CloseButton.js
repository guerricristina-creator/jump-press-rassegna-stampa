'use client';
export default function CloseButton(){
 const close=()=>{ window.location.replace('/'); };
 return <button type="button" className="pdfclose" onClick={close} aria-label="Chiudi ritaglio e torna alla rassegna">×</button>;
}