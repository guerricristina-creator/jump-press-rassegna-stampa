'use client';
import Link from 'next/link';
export default function AppControls(){
 const refresh=()=>{window.location.replace('/?v='+Date.now())};
 return <div className="appcontrols"><Link className="archivebutton" href="/archivio">Archivio</Link><button type="button" onClick={refresh} aria-label="Aggiorna rassegna">↻ <span>Aggiorna</span></button></div>;
}