#!/usr/bin/env python3
from pathlib import Path
import argparse,json,hashlib,html

def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--dist',default='dist');ap.add_argument('--ledger',default='dist/data/public-profile-suppressions.json');a=ap.parse_args()
 dist=Path(a.dist);ledger=Path(a.ledger);data=json.loads(ledger.read_text('utf-8'))
 if data.get('community')!='FRANKLIN_TN': raise SystemExit('SUPPRESSION_LEDGER_COMMUNITY_MISMATCH')
 active={str(e.get('profileId')) for e in data.get('entries',[]) if e.get('status')=='SUPPRESSED' and str(e.get('profileId','')).startswith('FR-')}
 manifest_path=dist/'data/franklin-profiles-manifest.json'; manifest=json.loads(manifest_path.read_text('utf-8'))
 removed=0
 for c in manifest.get('chunks',[]):
  p=dist/str(c['file']).lstrip('/');obj=json.loads(p.read_text('utf-8'));before=len(obj.get('records',[]));obj['records']=[r for r in obj.get('records',[]) if r.get('i') not in active];removed+=before-len(obj['records']);p.write_text(json.dumps(obj,separators=(',',':'),ensure_ascii=False)+'\n','utf-8');c['records']=len(obj['records']);c['bytes']=p.stat().st_size;c['sha256']=digest(p)
 manifest['recordCount']=sum(int(c.get('records',0)) for c in manifest.get('chunks',[]));manifest['heldInPublicProjection']=len(active);manifest['publicSuppressionLedgerApplied']=True;manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n','utf-8')
 for profile_id in active:
  p=dist/'profiles'/profile_id/'index.html'
  if not p.exists(): continue
  safe=html.escape(profile_id)
  p.write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Profile unavailable | Franklin Navigator</title><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/accessibility.css"></head><body><main id="main"><section class="section"><div class="wrap narrow"><h1>This profile is not publicly displayed.</h1><p>The profile has been removed from Franklin Navigator public view. This does not require a paid membership.</p><p><a class="button" href="/corrections/?profile='+safe+'">Contact Franklin Navigator about this profile</a></p></div></section></main></body></html>','utf-8')
 print(json.dumps({'result':'PASS','activeSuppressions':len(active),'directoryRowsRemoved':removed,'publicCount':manifest['recordCount']}))
if __name__=='__main__': main()
