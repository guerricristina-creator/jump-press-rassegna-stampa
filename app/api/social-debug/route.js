export const dynamic='force-dynamic';
const HANDLES=['juventusfc','DiMarzio','FabrizioRomano','NicoSchira','Glongari','romeoagresti','TuttoMercatoWeb','CronacheTweet'];
const ENDPOINTS=[
 ['poast',h=>`https://nitter.poast.org/${h}/rss`],
 ['twiiit',h=>`https://twiiit.com/${h}/rss`],
 ['rsshub1',h=>`https://rsshub.stsecurity.moe/twitter/user/${h}/exclude_replies`],
 ['rsshub2',h=>`https://rsshub.mt.cd/twitter/user/${h}/exclude_replies`],
 ['rsshub3',h=>`https://rsshub.yfi.moe/twitter/user/${h}/exclude_replies`]
];
async function probe(url){const c=new AbortController();const t=setTimeout(()=>c.abort(),5000);try{const r=await fetch(url,{cache:'no-store',signal:c.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml,application/xml,text/xml,*/*'}});const body=await r.text();return {status:r.status,len:body.length,items:(body.match(/<item>/g)||[]).length,juve:/juventus|juve|spalletti|yildiz|kessie|miretti/i.test(body)};}catch(e){return {error:String(e)}}finally{clearTimeout(t)}}
export async function GET(){const out={};for(const h of HANDLES){out[h]={};const rs=await Promise.all(ENDPOINTS.map(async ([n,f])=>[n,await probe(f(h))]));for(const [n,v] of rs)out[h][n]=v;}return Response.json(out,{headers:{'Cache-Control':'no-store'}})}
