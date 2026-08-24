'use client';
export default function AppControls(){
 const refresh=()=>{window.location.replace('/?v='+Date.now())};
 return <div className="appcontrols"><button type="button" onClick={refresh} aria-label="Aggiorna rassegna">↻ <span>Aggiorna</span></button></div>;
}