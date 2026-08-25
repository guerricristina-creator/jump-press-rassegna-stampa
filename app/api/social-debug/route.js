export const dynamic='force-dynamic';
const TESTS={
 bingX:'https://www.bing.com/search?q=site%3Ax.com%2FFabrizioRomano%2Fstatus+Juventus&count=20&setlang=it-IT',
 bingIG:'https://www.bing.com/search?q=site%3Ainstagram.com%2Fcalcioefinanza+Juventus&count=20&setlang=it-IT'
};
async function probe(url){const r=await fetch(url,{cache:'no-store',headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept':'text/html,*/*'}});const body=await r.text();const direct=[...new Set((body.match(/https?:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+/g)||[]).filter(x=>/x\.com\/FabrizioRomano|instagram\.com\/calcioefinanza/i.test(x)))].slice(0,30);return {status:r.status,len:body.length,direct,hasX:/x\.com\/FabrizioRomano/i.test(body),hasIG:/instagram\.com\/calcioefinanza/i.test(body),sample:body.slice(0,1000)};}
export async function GET(){const entries=await Promise.all(Object.entries(TESTS).map(async ([k,u])=>[k,await probe(u)]));return Response.json(Object.fromEntries(entries),{headers:{'Cache-Control':'no-store'}})}
