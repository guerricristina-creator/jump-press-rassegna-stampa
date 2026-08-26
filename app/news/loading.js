export default function Loading(){
 return <main className="newspage">
  <header className="newsheader">
   <div className="top"><div className="brand"><i>JUMP</i> PRESS</div><div className="edition">JUVENTUS · NEWS LIVE</div></div>
   <small>NEWS</small>
   <h1>Juventus <em>news</em></h1>
   <div className="newsstatus"><span className="liveDot"/> Caricamento aggiornamenti…</div>
  </header>
  <section className="newslist">
   <div className="newsempty"><b>Sto caricando le fonti.</b><span>La pagina resta aperta mentre arrivano gli aggiornamenti.</span></div>
  </section>
 </main>;
}
