const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=process.cwd(),read=p=>fs.readFileSync(root+'/'+p,'utf8');
const id='FR-ORG-b00c0ace7943973c';
const overlayPath='dist/data/discovery/r1329-franklin-navigator-profile.json';
const overlayText=read(overlayPath),overlay=JSON.parse(overlayText);
assert.equal(overlay.profileId,id);assert.equal(overlay.sourceRelease,'FR-PF-PLATFORM-15.28');assert.equal(overlay.addressType,'MAILING_ADDRESS_ONLY');assert.equal(overlay.physicalLocationVerified,false);assert.equal(overlay.records.length,1);assert.equal(overlay.records[0][0],id);assert.equal(overlay.records[0][1],'Franklin Navigator');assert.match(overlay.records[0][2],/^Mailing address only:/);assert.equal(crypto.createHash('sha256').update(overlayText).digest('hex'),'a0b3b76b90b418dd9b493d6733056820231b3606c5fa9e25e7415f4788aed5bf');
const profile=read('dist/profiles/'+id+'/index.html');assert(profile.includes('Review or claim this profile'));assert(profile.includes('Mailing address only:'));assert(profile.includes('/claim-profile/?profile='+id));assert(profile.includes('/member-profile-preview/?profile='+id));assert(!/Google Maps|map pin|directions to our office/i.test(profile));assert(!profile.includes('FR-TEST-SCC-OWNER-CONTROL'));
for(const p of ['dist/assets/hf310.js','dist/assets/membership-live.js']){const s=read(p);assert(s.includes('/data/discovery/r1329-franklin-navigator-profile.json'));assert(s.includes(id));assert(!s.includes('FR-TEST-SCC-OWNER-CONTROL'))}
const discovery=read('dist/assets/local-discovery-data.js');assert(discovery.includes("OVERLAY_ID='FR-ORG-b00c0ace7943973c'"));assert(discovery.includes("rows.concat(add)"));assert(discovery.includes("if (id === OVERLAY_ID)"));
const es=read('dist/es/iniciar-membresia/index.html');assert(es.includes('$35/año'));assert(es.includes('Buscar o administrar mi perfil primero'));assert(!/inscripci[oó]n permanece cerrada/i.test(es));
const membershipSitemap=read('dist/sitemap-membership.xml');assert(membershipSitemap.includes('/es/iniciar-membresia/'));
for(const [path,txt] of [['profile',profile],['spanish-membership',es]]){assert(!/PROFILE_FACTORY|FR-TEST-SCC|builder|candidate release|SCC gate/i.test(txt),path+' leaked internal language')}
const prod=JSON.parse(read('PRODUCTION_RELEASE.json'));assert.equal(prod.release,'FR-NAV1.30.29-HF3.13.11');assert.equal(prod.counts.profiles,19104);assert.equal(prod.authority.pf15_28CanonicalProfileId,id);
console.log('R1329 profile integration contracts PASS');
