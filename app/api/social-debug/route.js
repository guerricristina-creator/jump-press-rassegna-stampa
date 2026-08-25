export const dynamic='force-dynamic';
const TESTS={
 bingX:'https://www.bing.com/search?q=site%3Ax.com%2FFabrizioRomano+Juventus&format=rss',
 bingIG:'https://www.bing.com/search?q=site%3Ainstagram.com%2Fcalcioefinanza+Juventus&format=rss',
 googleX:'https://www.google.com/search?q=site%3Ax.com%2FFabrizioRomano+Juventus&num=10&hl=it'
};
async function probe(url){const c=new AbortController();const t=setTimeout(()=>c.abort(),7000);try{const r=await fetch(url,{cache:'no-store',signal:c.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept':'text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.8'}});const body=await r.text();return {status:r.status,len:body.length,items:(body.match(/<item>/g)||[]).length,hasX:/x\.com|twitter\.com/i.test(body),hasIG:/instagram\.com/i.test(body),hasJuve:/juventus|juve|spalletti|yildiz|kessie|miretti/i.test(body),sample:body.slice(0,500)};}catch(e){return {error:String(e)}}finally{clearTimeout(t)}}
export async function GET(){const entries=await Promise.all(Object.entries(TESTS).map(async ([k,u])=>[k,await probe(u)]));return Response.json(Object.fromEntries(entries),{headers:{'Cache-Control':'no-store'}})}
