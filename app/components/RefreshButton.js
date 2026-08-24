'use client';
export default function RefreshButton(){
 return <button className="apprefresh" type="button" onClick={()=>window.location.reload()} aria-label="Aggiorna JUMP PRESS" title="Aggiorna">↻</button>;
}