export const dynamic='force-dynamic';
const BASE='https://rsshub.stsecurity.moe';
const TESTS=[
 ['X','Juventus',`${BASE}/twitter/user/juventusfc/exclude_replies`],
 ['X','Di Marzio',`${BASE}/twitter/user/DiMarzio/exclude_replies`],
 ['X','Fabrizio Romano',`${BASE}/twitter/user/FabrizioRomano/exclude_replies`],
 ['X','Schira',`${BASE}/twitter/user/NicoSchira/exclude_replies`],
 ['X','Longari',`${BASE}/twitter/user/Glongari/exclude_replies`],
 ['X','Agresti',`${BASE}/twitter/user/romeoagresti/exclude_replies`],
 ['X','TMW',`${BASE}/twitter/user/TuttoMercatoWeb/exclude_replies`],
 ['X','Cronache',`${BASE}/twitter/user/CronacheTweet/exclude_replies`],
 ['X','Calcio e Finanza',`${BASE}/twitter/user/CalcioFinanza/exclude_replies`],
 ['X','Paolo Ardoino',`${BASE}/twitter/user/paoloardoino/exclude_replies`],
 ['Instagram','Calcio e Finanza',`${BASE}/instagram/user/calcioefinanza`],
 ['Instagram','Paolo Ardoino',`${BASE}/instagram/user/paoloardoino_prdn`]
];
async function probe([platform,name,url]){
 const c=new AbortController();const t=setTimeout(()=>c.abort(),9000);
 try{
  const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml,application/xml,text/xml,*/*'}});
  const body=await r.text();
  return {platform,name,status:r.status,len:body.length,items:(body.match(/<item>/g)||[]).length,hasJuve:/juventus|juve|kessie|miretti|sorloth|zirkzee|spalletti|yildiz/i.test(body),sample:body.slice(0,220)};
 }catch(e){return {platform,name,error:String(e)}}finally{clearTimeout(t)}
}
export async function GET(){return Response.json(await Promise.all(TESTS.map(probe)),{headers:{'Cache-Control':'no-store'}})}
