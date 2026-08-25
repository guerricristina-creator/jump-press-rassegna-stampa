export const dynamic='force-dynamic';
const BASES=[
 'https://rsshub.edwardcc.com',
 'https://rsshub.cinte.cc',
 'https://rss.wudifeixue.com',
 'https://rss.littlebaby.life',
 'https://rsshub.henry.wang',
 'https://rsshub.umzzz.com',
 'https://rsshub.isrss.com',
 'https://rsshub.email-once.com',
 'https://rss.datuan.dev',
 'https://rss.4040940.xyz',
 'https://rsshub.cups.moe',
 'https://rsshub-balancer.virworks.moe'
];
async function probe(base){
 const c=new AbortController();const t=setTimeout(()=>c.abort(),6500);
 try{
  const url=`${base}/twitter/user/FabrizioRomano/exclude_replies`;
  const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml,application/xml,text/xml,*/*'}});
  const body=await r.text();
  return {base,status:r.status,len:body.length,items:(body.match(/<item>/g)||[]).length,hasJuve:/juventus|juve|kessie|miretti|spalletti|yildiz/i.test(body),sample:body.slice(0,220)};
 }catch(e){return {base,error:String(e)}}finally{clearTimeout(t)}
}
export async function GET(){return Response.json(await Promise.all(BASES.map(probe)),{headers:{'Cache-Control':'no-store'}})}
