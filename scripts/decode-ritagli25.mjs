import {readFileSync,writeFileSync,unlinkSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const dir='public/ritagli';
for(const f of readdirSync(dir)){
 if(f.endsWith('.pdf.b64')){
  const src=join(dir,f); const dst=join(dir,f.slice(0,-4));
  writeFileSync(dst,Buffer.from(readFileSync(src,'utf8').trim(),'base64'));
  unlinkSync(src);
 }
}
