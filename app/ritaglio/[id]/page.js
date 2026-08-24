import CloseButton from '../../components/CloseButton';

export default async function Ritaglio({params}){
  const {id}=await params;
  return <div className="pdfviewer">
    <div className="pdfbar"><div className="pdfbrand"><i>JUMP</i> PRESS <span>· RITAGLIO COMPLETO</span></div><CloseButton /></div>
    <iframe className="pdfframe" src={`/ritagli/${encodeURIComponent(id)}.pdf`} title="Ritaglio completo" />
  </div>
}