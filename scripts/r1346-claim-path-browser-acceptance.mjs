import fs from 'node:fs';

const baseUrl=new URL('./r1346-claim-path-browser-acceptance-base.mjs',import.meta.url);
const generatedUrl=new URL('./.r1362-r1346-claim-path-browser-acceptance.generated.mjs',import.meta.url);
let source=fs.readFileSync(baseUrl,'utf8');
source=source
  .replaceAll('Continue with this profile','Start management verification')
  .replaceAll('Connecting profile…','Starting management verification…');
fs.writeFileSync(generatedUrl,source,'utf8');
try{
  await import(generatedUrl.href+'?r1362='+Date.now());
}finally{
  fs.rmSync(generatedUrl,{force:true});
}
