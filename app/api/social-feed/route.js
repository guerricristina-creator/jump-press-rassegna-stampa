import {NextResponse} from 'next/server';
import {unstable_cache} from 'next/cache';

export const dynamic='force-dynamic';
const SOCIAL_MAX_AGE=3*24*60*60*1000;
const X_FEED_BASES=['https://rsshub.yfi.moe','https://rsshub.stsecurity.moe','https://rsshub.edwardcc.com','https://rsshub.isrss.com'];
const SOURCES=[
 {name:'Juventus',handle:'juventusfc',official:true},{name:'Gianluca Di Marzio',handle:'DiMarzio'},
 {name:'Fabrizio Romano',handle:'FabrizioRomano'},{name:'Nicolò Schira',handle:'NicoSchira'},
 {name:'Gianluigi Longari',handle:'Glongari'},{name:'Romeo Agresti',handle:'romeoagresti'},
 {name:'TUTTOmercatoWEB',handle:'TuttoMercatoWeb'},{name:'Cronache di Spogliatoio',handle:'CronacheTweet'},
 {name:'Corriere dello Sport',handle:'CorSport'},{name:'Sport Mediaset',handle:'sportmediaset'},
 {name:'Sky Sport',handle:'SkySport'},{name:'ilBiancoNero',handle:'ilbianconerocom'},
 {name:'Fanpage.it',handle:'fanpage'},{name:'Calcio Totale',handle:'calcio_morelli'},
 {name:'Calcio e Finanza',handle:'CalcioFinanza',allPosts:true},{name:'Paolo Ardoino',handle:'paoloardoino',ardoino:true}
];
function decodeXml(s=''){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));}
function xmlText(block,tag){const m=block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?decodeXml(m[1].trim()):'';}
function cleanHtml(v=''){return decodeXml(v).replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]+>/g,' ').replace(/https?:\/\/t\.co\/\S+/gi,'').replace(/\s+/g,' ').trim();}
function relevant(body='',s={}){
 if(/\b(juventus|juve|bianconer\w*|vecchia\s+signora|continassa|jtc|allianz\s*stadium)\b/i.test(body))return true;
 if(/\b(spalletti|yildiz|bremer|thuram|koopmeiners|cambiaso|di\s*gregorio|miretti|gatti|locatelli|conceicao|mcKennie|weah|rugani|kalulu|chiellini|comolli)\b/i.test(body))return true;
 return Boolean(s.ardoino&&/\b(zebra|zebre|jay)\b/i.test(body));
}
function parseXFeed(xml,s){return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m=>{const b=m[1],date=xmlText(b,'pubDate')||xmlText(b,'dc:date'),title=cleanHtml(xmlText(b,'title')),desc=cleanHtml(xmlText(b,'description')),enc=cleanHtml(xmlText(b,'content:encoded'));let body=[enc,desc,title].sort((a,b)=>b.length-a.length)[0]||'';body=body.replace(/^RT by @?[^:]+:\s*/i,'').replace(/^RT @?[^:]+:\s*/i,'').trim();const raw=xmlText(b,'link')||xmlText(b,'guid'),status=raw.match(/\/status\/(\d+)/)?.[1];return {source:s.name,body,date,ts:Date.parse(date)||0,link:status?`https://x.com/${s.handle}/status/${status}`:`https://x.com/${s.handle}`};}).filter(p=>p.body&&(s.official||s.allPosts||relevant(p.body,s)));}
async function fetchBase(base,handle){const c=new AbortController(),t=setTimeout(()=>c.abort(),3500);try{const r=await fetch(`${base}/twitter/user/${handle}/exclude_replies`,{cache:'no-store',signal:c.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5'}});if(!r.ok)throw new Error(String(r.status));const xml=await r.text();if(!/<item>/i.test(xml))throw new Error('empty');return xml;}finally{clearTimeout(t)}}
async function fetchRss(handle){return Promise.any(X_FEED_BASES.map(base=>fetchBase(base,handle)));}
function cleanMarkdown(s=''){return s.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g,' ').replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\\([#_*`])/g,'$1').replace(/## Log in or sign up for X[\s\S]*$/i,'').replace(/## See .*?full profile[\s\S]*$/i,'').replace(/\s+/g,' ').trim();}
function relativeDate(label=''){const now=Date.now();let m=label.match(/^(\d+)(s|m|h|d)$/i);if(m){const mult={s:1000,m:60000,h:3600000,d:86400000}[m[2].toLowerCase()];return new Date(now-Number(m[1])*mult)}m=label.match(/^([A-Z][a-z]{2})\s+(\d{1,2})(?:,\s*(\d{4}))?$/);if(m){const y=m[3]?Number(m[3]):new Date().getUTCFullYear();return new Date(`${m[1]} ${m[2]}, ${y} 12:00:00 UTC`)}return new Date(0)}
function parseJina(text,s){const out=[];for(const block of text.split(/\n(?=\*\s+)/g)){const re=new RegExp(`\\[([^\\]]+)\\]\\(https:\\/\\/x\\.com\\/${s.handle}\\/status\\/(\\d+)\\)`,'i'),hit=block.match(re);if(!hit)continue;const body=cleanMarkdown(block.slice((hit.index||0)+hit[0].length)),d=relativeDate(hit[1].trim()),ts=d.getTime();if(!body||!ts||!(s.official||s.allPosts||relevant(body,s)))continue;out.push({source:s.name,body,date:d.toISOString(),ts,link:`https://x.com/${s.handle}/status/${hit[2]}`});}return out;}
async function fetchJina(handle){const c=new AbortController(),t=setTimeout(()=>c.abort(),5000);try{const r=await fetch(`https://r.jina.ai/https://x.com/${handle}`,{cache:'no-store',signal:c.signal,headers:{Accept:'text/plain','User-Agent':'Mozilla/5.0'}});if(!r.ok)throw new Error(String(r.status));return await r.text();}finally{clearTimeout(t)}}
const rssCache=unstable_cache(async h=>fetchRss(h),['social-api-rss-v1'],{revalidate:120});
const jinaCache=unstable_cache(async h=>fetchJina(h),['social-api-jina-v1'],{revalidate:180});
async function one(s){try{const p=parseXFeed(await rssCache(s.handle),s);if(p.length)return p.slice(0,s.allPosts?25:15)}catch{}try{return parseJina(await jinaCache(s.handle),s).slice(0,s.allPosts?25:12)}catch{return []}}
function dedupe(a){const seen=new Set();return a.sort((x,y)=>y.ts-x.ts).filter(p=>{const k=p.link||p.body;if(!k||seen.has(k))return false;seen.add(k);return true})}
async function build(){const settled=await Promise.allSettled(SOURCES.map(one));const cutoff=Date.now()-SOCIAL_MAX_AGE,counts=new Map();return dedupe(settled.flatMap(r=>r.status==='fulfilled'?r.value:[])).filter(p=>p.ts>=cutoff).filter(p=>{const max=p.source==='Calcio e Finanza'?25:p.source==='Juventus'?10:12,n=counts.get(p.source)||0;if(n>=max)return false;counts.set(p.source,n+1);return true}).slice(0,120)}
export async function GET(){const posts=await build();return NextResponse.json({posts,generatedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}})}
