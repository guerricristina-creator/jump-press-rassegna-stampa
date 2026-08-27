export const dynamic='force-dynamic';

const TESTS=[
 ['rsshub-isrss','https://rsshub.isrss.com/twitter/user/NicoSchira/exclude_replies'],
 ['rsshub-cinte','https://rsshub.cinte.cc/twitter/user/NicoSchira/exclude_replies'],
 ['rsshub-stsecurity','https://rsshub.stsecurity.moe/twitter/user/NicoSchira/exclude_replies'],
 ['rsshub-rssforever','https://rsshub.rssforever.com/twitter/user/NicoSchira/exclude_replies'],
 ['nitter-rss','https://nitter.kareem.one/NicoSchira/rss'],
 ['nitter-html','https://nitter.kareem.one/NicoSchira']
];

async function probe(name,url){
 const c=new AbortController();
 const t=setTimeout(()=>c.abort(),5000);
 const started=Date.now();
 try{
  const r=await fetch(url,{cache:'no-store',signal:c.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.8'}});
  const text=await r.text();
  return {name,status:r.status,ok:r.ok,ms:Date.now()-started,length:text.length,hasItem:/<item>/i.test(text),hasTimeline:/timeline-item/i.test(text),head:text.slice(0,120)};
 }catch(e){return {name,ok:false,ms:Date.now()-started,error:String(e?.name||e)+': '+String(e?.message||'')}}
 finally{clearTimeout(t)}
}

export async function GET(){
 const results=[];
 for(const [name,url] of TESTS) results.push(await probe(name,url));
 return Response.json({ok:true,at:new Date().toISOString(),results},{headers:{'Cache-Control':'no-store'}});
}
