export const dynamic='force-dynamic';

export async function GET(){
 const c=new AbortController();
 const t=setTimeout(()=>c.abort(),10000);
 try{
  const r=await fetch('https://r.jina.ai/https://x.com/NicoSchira',{cache:'no-store',signal:c.signal,headers:{'Accept':'text/plain'}});
  const text=await r.text();
  return Response.json({status:r.status,ok:r.ok,length:text.length,text:text.slice(0,12000)},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({ok:false,error:String(e?.name||e)+': '+String(e?.message||'')},{headers:{'Cache-Control':'no-store'}})}
 finally{clearTimeout(t)}
}
