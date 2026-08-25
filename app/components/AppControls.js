'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

export default function AppControls(){
 const pathname=usePathname();
 const inArchive=pathname.startsWith('/archivio');
 const onArchiveIndex=pathname==='/archivio';
 const inNews=pathname.startsWith('/news');
 const refreshHome=()=>{window.location.replace('/?v='+Date.now())};
 const refreshNews=()=>{
  const url=new URL(window.location.href);
  url.searchParams.set('v',Date.now().toString());
  window.location.replace(url.pathname+'?'+url.searchParams.toString());
 };

 if(onArchiveIndex){
  return <div className="appcontrols"><Link className="backbutton" href="/">← <span>Indietro</span></Link></div>;
 }

 if(inArchive){
  return <div className="appcontrols"><Link className="archivebutton" href="/archivio">Archivio</Link><Link className="backbutton" href="/">← <span>Indietro</span></Link></div>;
 }

 if(inNews){
  return <div className="appcontrols"><button type="button" onClick={refreshNews} aria-label="Aggiorna news">↻ <span>Aggiorna</span></button><Link className="backbutton" href="/">← <span>Indietro</span></Link></div>;
 }

 return <div className="appcontrols homecontrols"><div className="navstack"><Link className="archivebutton" href="/archivio">Archivio</Link><Link className="newsbutton" href="/news">News</Link></div><button type="button" onClick={refreshHome} aria-label="Aggiorna rassegna">↻ <span>Aggiorna</span></button></div>;
}
