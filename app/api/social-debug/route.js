export const dynamic='force-dynamic';
const TESTS={
 bingX:'https://www.bing.com/search?q=site%3Ax.com%2FFabrizioRomano+Juventus&format=rss',
 bingIG:'https://www.bing.com/search?q=site%3Ainstagram.com%2Fcalcioefinanza+Juventus&format=rss'
};
function dec(s=''){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function text(b,t){const m=b.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${t}>`,'i'));return m?dec(m[1].trim()):''}
async function probe(url){const r=await fetch(url,{cache:'no-store',headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml,application/xml,text/xml,*/*'}});const body=await r.text();const parsed=[...body.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m=>({title:text(m[1],'title'),link:text(m[1],'link'),description:text(m[1],'description'),pubDate:text(m[1],'pubDate')}));return {status:r.status,items:parsed};}
export async function GET(){const entries=await Promise.all(Object.entries(TESTS).map(async ([k,u])=>[k,await probe(u)]));return Response.json(Object.fromEntries(entries),{headers:{'Cache-Control':'no-store'}})}
