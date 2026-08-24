'use client';
export default function RefreshButton(){
 const refresh=()=>{window.location.href='/?refresh='+Date.now()};
 return <button className="apprefresh" type="button" onClick={refresh} aria-label="Aggiorna JUMP PRESS" title="Aggiorna"><span>↻</span> Aggiorna</button>;
}