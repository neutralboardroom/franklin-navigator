const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),dist=path.join(root,'dist');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const profileRoot=path.join(dist,'profiles');
const profiles=fs.readdirSync(profileRoot).filter(n=>fs.existsSync(path.join(profileRoot,n,'index.html')));
const fail=[]; const ok=(c,m)=>{if(!c)fail.push(m)};
for(const id of profiles){const h=fs.readFileSync(path.join(profileRoot,id,'index.html'),'utf8');ok(h.includes('/assets/app.js'),`shared app missing ${id}`);ok(h.includes('profile-primary-actions'),`primary actions missing ${id}`)}
const app=read('dist/assets/app.js'),css=read('dist/assets/styles.css'),claim=read('dist/assets/hf310.js'),biz=read('dist/business-dashboard/index.html'),membership=read('dist/membership-start/index.html');
ok(app.includes('R1343 — universal profile-control visibility guard'),'universal claim guard missing');
ok(app.includes("'/profile-access/?profile='+encodeURIComponent(profileId)"),'claim deep link missing');
ok(app.includes('Review / correct this profile'),'secondary correction link missing');
ok(css.includes('--claim-accent:#f6c453')&&css.includes('.r1343-claim-primary'),'distinct claim style missing');
ok(claim.includes("b.textContent='Claim this profile'")&&claim.includes('card.append(b)'),'claim result action missing');
ok(biz.includes('Find your Franklin profile. Improve it. Grow your local visibility.'),'approved business headline missing');
ok(biz.includes('$35/year')&&membership.includes('$35/year'),'membership price visibility missing');
ok(fs.existsSync(path.join(dist,'community-help-center','index.html')),'help center missing');
ok(fs.existsSync(path.join(dist,'get-it-done','index.html')),'get it done missing');
ok(fs.existsSync(path.join(dist,'directory','index.html')),'directory missing');
if(fail.length){console.error(JSON.stringify({result:'FAIL',profilePages:profiles.length,fail},null,2));process.exit(1)}
console.log(JSON.stringify({result:'PASS',release:'FR-NAV1.30.43-HF3.13.25',profilePages:profiles.length,checks:['all profiles load shared app','all profiles expose primary action group','universal visible claim/manage CTA','visible free correction action','distinct claim-search action','R1340 approved headline','R1341 membership price visibility','Help Center','Get It Done','Directory']},null,2));
