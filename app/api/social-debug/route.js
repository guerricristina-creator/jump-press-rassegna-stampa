export const dynamic='force-dynamic';
const URL='https://www.bing.com/search?q=site%3Ax.com%2FFabrizioRomano%2Fstatus+Juventus&count=20&setlang=it-IT&cc=it';
function strip(s=''){return s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim()}
export async function GET(){
 const r=await fetch(URL,{cache:'no-store',headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept':'text/html,*/*'}});
 const body=await r.text();
 const algos=[...body.matchAll(/<li class="b_algo"[\s\S]*?<\/li>/gi)].slice(0,20).map(m=>{
  const block=m[0];
  const hrefs=[...block.matchAll(/href="([^"]+)"/gi)].map(x=>x[1].replace(/&amp;/g,'&'));
  return {text:strip(block).slice(0,1500),hrefs};
 });
 const idx=body.toLowerCase().indexOf('fabrizioromano');
 return Response.json({status:r.status,len:body.length,algos,around:idx>=0?body.slice(Math.max(0,idx-1500),idx+4000):''},{headers:{'Cache-Control':'no-store'}})
}
