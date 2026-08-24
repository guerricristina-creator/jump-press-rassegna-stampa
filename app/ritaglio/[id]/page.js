import Link from 'next/link';

export default async function Ritaglio({params}){
  const {id}=await params;
  return <div className="pdfviewer">
    <div className="pdfbar"><div className="pdfbrand"><i>JUMP</i> PRESS <span>· RITAGLIO COMPLETO</span></div><Link href="/" className="pdfclose" aria-label="Chiudi ritaglio e torna alla rassegna">×</Link></div>
    <iframe className="pdfframe" src={`/ritagli/${encodeURIComponent(id)}.pdf`} title="Ritaglio completo" />
  </div>
}