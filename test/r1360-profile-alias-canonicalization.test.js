'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {loadProfileScope}=require('../lib/profile-scope');
const root=path.join(__dirname,'..');
const aliasDoc=JSON.parse(fs.readFileSync(path.join(root,'data/profile-aliases-r1360.json'),'utf8'));

test('R1360 PF15.37 alias contract removes aliases and held profiles from runtime scope',()=>{
  assert.equal(aliasDoc.schema,'franklin.runtime-profile-aliases.v1');
  assert.equal(aliasDoc.community,'FRANKLIN_TN');
  assert.equal(aliasDoc.sourceRelease,'FR-PF-PLATFORM-15.37');
  assert.equal(aliasDoc.sourceArtifactSha256,'3feac2b4f8c912e2dced0ef9bcea76902b91776651a0829d9914693d78fff4b7');
  assert.equal(Object.keys(aliasDoc.aliases).length,99);
  const scope=loadProfileScope();
  for(const [alias,canonical] of Object.entries(aliasDoc.aliases)){
    assert.equal(scope.aliases[alias],canonical);
    assert.equal(Object.hasOwn(scope.profiles,alias),false,alias+' alias must not remain claimable');
    assert.equal(Object.hasOwn(scope.profiles,canonical),true,canonical+' canonical must exist');
  }
  for(const held of aliasDoc.heldProfileIds)assert.equal(Object.hasOwn(scope.profiles,held),false,held+' must remain held');
});

test('R1360 runtime canonicalizes inbound profile IDs and fail-closes reconciliation conflicts',()=>{
  const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
  assert.match(server,/PROFILE_ALIAS_VERSION='FRANKLIN_PROFILE_ALIAS_R1360_1'/);
  assert.match(server,/function normalizeProfile\(value\)[\s\S]{0,260}profileAliases\[id\]\|\|id/);
  assert.match(server,/await initializeProfileAliasRegistry\(\);await reconcileProfileAliases\(\)/);
  assert.match(server,/PROFILE_ALIAS_RECONCILIATION_CONFLICT/);
  for(const table of ['franklin_profile_links','franklin_checkout_intents','franklin_memberships','franklin_representation_reviews','franklin_profile_invitations']) assert.ok(server.includes(table));
  assert.match(server,/profileAliasReconciliation/);
});
