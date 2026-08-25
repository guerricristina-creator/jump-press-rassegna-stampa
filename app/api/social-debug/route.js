export const dynamic='force-dynamic';
const TESTS={
 syndRomano:'https://syndication.twitter.com/srv/timeline-profile/screen-name/FabrizioRomano',
 syndDiMarzio:'https://syndication.twitter.com/srv/timeline-profile/screen-name/DiMarzio',
 twiiitRomano:'https://twiiit.com/FabrizioRomano/rss',
 rsshubRomano:'https://rsshub.stsecurity.moe/twitter/user/FabrizioRomano/exclude_replies',
 jinaTwStalker:'https://r.jina.ai/https://site.twstalker.com/FabrizioRomano'
};
async function probe(url){
 const c=new AbortController();const t=setTimeout(()=>c.abort(),7000);
 try{
  const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html,application/rss+xml,application/xml,text/plain,*/*'}});
  const body=await r.text();
  return {status:r.status,len:body.length,items:(body.match(/<item>/g)||[]).length,hasJuve:/juventus|juve|kessie|miretti|sorloth|zirkzee/i.test(body),statusIds:[...new Set(body.match(/status\/(\d+)/g)||[])].slice(0,20),sample:body.slice(0,2500)};
 }catch(e){return {error:String(e)}}finally{clearTimeout(t)}
}
export async function GET(){const entries=await Promise.all(Object.entries(TESTS).map(async ([k,u])=>[k,await probe(u)]));return Response.json(Object.fromEntries(entries),{headers:{'Cache-Control':'no-store'}})}
