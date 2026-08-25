export const dynamic='force-dynamic';
const TESTS=[
 ['Calcio e Finanza','https://r.jina.ai/https://www.instagram.com/calcioefinanza/'],
 ['Paolo Ardoino','https://r.jina.ai/https://www.instagram.com/paoloardoino_prdn/']
];
async function probe([name,url]){
 const c=new AbortController();const t=setTimeout(()=>c.abort(),10000);
 try{
  const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{'User-Agent':'Mozilla/5.0','Accept':'text/plain,*/*'}});
  const body=await r.text();
  return {name,status:r.status,len:body.length,hasJuve:/juventus|juve|spalletti|yildiz|kessie|bianconer/i.test(body),sample:body.slice(0,2500)};
 }catch(e){return {name,error:String(e)}}finally{clearTimeout(t)}
}
export async function GET(){return Response.json(await Promise.all(TESTS.map(probe)),{headers:{'Cache-Control':'no-store'}})}
