'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

export default function AppControls(){
 const pathname=usePathname();
 const inArchive=pathname.startsWith('/archivio');
 const onArchiveIndex=pathname==='/archivio';
 const refresh=()=>{window.location.replace('/?v='+Date.now())};

 if(onArchiveIndex){
  return <div className="appcontrols"><Link className="backbutton" href="/">← <span>Indietro</span></Link></div>;
 }

 if(inArchive){
  return <div className="appcontrols"><Link className="archivebutton" href="/archivio">Archivio</Link><Link className="backbutton" href="/">← <span>Indietro</span></Link></div>;
 }

 return <div className="appcontrols"><Link className="archivebutton" href="/archivio">Archivio</Link><button type="button" onClick={refresh} aria-label="Aggiorna rassegna">↻ <span>Aggiorna</span></button></div>;
}
