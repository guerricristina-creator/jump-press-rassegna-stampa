export const dynamic='force-dynamic';
const TESTS={
 googleX:'https://www.google.com/search?q=site%3Ax.com%2FFabrizioRomano%2Fstatus+Juventus&num=20&hl=it&filter=0',
 googleIG:'https://www.google.com/search?q=site%3Ainstagram.com%2Fcalcioefinanza+Juventus&num=20&hl=it&filter=0'
};
async function probe(url){const r=await fetch(url,{cache:'no-store',headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept':'text/html,*/*'}});const body=await r.text();const urls=[...new Set((body.match(/https?:\\?\/\\?\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+/g)||[]).map(x=>x.replace(/\\\//g,'/')).filter(x=>/x\.com\/|instagram\.com\//i.test(x)))].slice(0,30);return {status:r.status,len:body.length,urls,snippets:urls.slice(0,8).map(u=>{const i=body.indexOf(u.replace(/\//g,'\\/'))>=0?body.indexOf(u.replace(/\//g,'\\/')):body.indexOf(u);return i>=0?body.slice(Math.max(0,i-250),i+500):''})};}
export async function GET(){const entries=await Promise.all(Object.entries(TESTS).map(async ([k,u])=>[k,await probe(u)]));return Response.json(Object.fromEntries(entries),{headers:{'Cache-Control':'no-store'}})}
