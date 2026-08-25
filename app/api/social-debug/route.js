export const dynamic='force-dynamic';
const BASES=[
 'https://rsshub.app',
 'https://rsshub.rssforever.com',
 'https://hub.slarker.me',
 'https://rsshub.pseudoyu.com',
 'https://rsshub.rss.tips',
 'https://rsshub.ktachibana.party',
 'https://rss.owo.nz',
 'https://rsshub.stsecurity.moe',
 'https://rsshub.mt.cd',
 'https://rsshub.yfi.moe'
];
async function probe(base){
 const c=new AbortController();const t=setTimeout(()=>c.abort(),7000);
 try{
  const url=`${base}/twitter/user/FabrizioRomano/exclude_replies`;
  const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml,application/xml,text/xml,*/*'}});
  const body=await r.text();
  return {base,status:r.status,len:body.length,items:(body.match(/<item>/g)||[]).length,hasJuve:/juventus|juve|kessie|miretti|sorloth|zirkzee/i.test(body),sample:body.slice(0,350)};
 }catch(e){return {base,error:String(e)}}finally{clearTimeout(t)}
}
export async function GET(){return Response.json(await Promise.all(BASES.map(probe)),{headers:{'Cache-Control':'no-store'}})}
