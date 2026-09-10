#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import argparse, datetime as dt, json, re

ROOT=Path(__file__).resolve().parents[1]
LEDGER=ROOT/'dist/data/public-profile-suppressions.json'
PROFILE_RE=re.compile(r'^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$')

def now(): return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')

def main():
    ap=argparse.ArgumentParser(description='Record an explicitly reviewed Franklin public-profile suppression or reinstatement. This never edits Profile Factory source facts.')
    ap.add_argument('action',choices=['suppress','reinstate'])
    ap.add_argument('--profile-id',required=True)
    ap.add_argument('--request-ref',required=True,help='Durable request/reference identifier from the free profile-control workflow')
    ap.add_argument('--reviewer-ref',required=True,help='Internal reviewer/operator reference; do not put this on public pages')
    ap.add_argument('--reason',required=True)
    args=ap.parse_args()
    if not PROFILE_RE.match(args.profile_id): raise SystemExit('PROFILE_ID_INVALID')
    if len(args.request_ref.strip())<8 or len(args.reason.strip())<8 or len(args.reviewer_ref.strip())<3: raise SystemExit('REVIEW_EVIDENCE_REQUIRED')
    data=json.loads(LEDGER.read_text('utf-8'))
    if data.get('community')!='FRANKLIN_TN': raise SystemExit('SUPPRESSION_LEDGER_COMMUNITY_MISMATCH')
    entries=data.setdefault('entries',[])
    entry=next((e for e in entries if e.get('profileId')==args.profile_id),None)
    event={'at':now(),'action':args.action.upper(),'requestRef':args.request_ref.strip()[:120],'reviewerRef':args.reviewer_ref.strip()[:120],'reason':args.reason.strip()[:600]}
    if entry is None:
        entry={'profileId':args.profile_id,'status':'ACTIVE','history':[]}; entries.append(entry)
    entry.setdefault('history',[]).append(event)
    if args.action=='suppress':
        entry['status']='SUPPRESSED'; entry['suppressedAt']=event['at']; entry['suppressionRequestRef']=event['requestRef']; entry.pop('reinstatedAt',None)
    else:
        if entry.get('status')!='SUPPRESSED': raise SystemExit('PROFILE_NOT_CURRENTLY_SUPPRESSED')
        entry['status']='ACTIVE'; entry['reinstatedAt']=event['at']
    data['updatedAt']=event['at']
    LEDGER.write_text(json.dumps(data,ensure_ascii=False,indent=2,sort_keys=True)+'\n','utf-8')
    print(json.dumps({'result':'RECORDED','profileId':args.profile_id,'status':entry['status'],'requestRef':event['requestRef']}))

if __name__=='__main__': main()
