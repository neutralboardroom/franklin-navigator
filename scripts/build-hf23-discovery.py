#!/usr/bin/env python3
"""Build only derived indexes from the exact existing Franklin public profile handoff.
No canonical profile facts, contacts, membership state or upstream acceptance is created.
"""
import argparse, hashlib, json, pathlib

def sha(b): return hashlib.sha256(b).hexdigest()
def encode(o): return (json.dumps(o,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n').encode()
def shard(identity):
    h=2166136261
    for c in identity: h=((h^ord(c))*16777619)&0xffffffff
    return f'{h%64:02x}'
def compact(rows, source_hash, routes=False):
    fields={'categories':'c','types':'t','areas':'g','websites':'w','dates':'d'}
    dictionaries={key:sorted(set(str(r.get(field) or '') for r in rows)) for key,field in fields.items()}
    refs={key:{v:i for i,v in enumerate(values)} for key,values in dictionaries.items()}
    out=[]
    for r in rows:
        assert isinstance(r['h'],bool) and isinstance(r['x'],int)
        out.append([r['i'],r['n'],r.get('l') or '',refs['categories'][r['c']],refs['types'][r['t']],refs['areas'][r['g']],refs['websites'][r.get('w') or ''],r.get('p') or '',r.get('e') or '',refs['dates'][r['d']],r['h'],r['x']])
    obj={'schemaVersion':'franklin.profile-route-shard.v1' if routes else 'franklin.discovery-index.v1','community':'FRANKLIN_TN','sourceManifestSha256':source_hash,**dictionaries}
    obj['records' if routes else 'rows']=out
    if not routes:obj['recordCount']=len(out)
    return obj

def build(dist):
    source=dist/'data/franklin-profiles-manifest.json'; raw=source.read_bytes(); m=json.loads(raw)
    assert m['schemaVersion']=='franklin.public-profile-manifest.v3' and m['recordCount']==19103 and m['sourceRelease']=='FR-PF-PLATFORM-15.4', 'Changed source requires new independent reconciliation'
    all_rows=[]
    for descriptor in m['chunks']:
        p=dist/descriptor['file'].lstrip('/'); assert p.resolve().is_relative_to(dist.resolve()) and not p.is_symlink()
        b=p.read_bytes(); assert sha(b)==descriptor['sha256']
        records=json.loads(b)
        if isinstance(records,dict): records=records.get('profiles',records.get('records'))
        all_rows.extend(records)
    assert len(all_rows)==m['recordCount'] and len({r['i'] for r in all_rows})==len(all_rows)
    for r in all_rows: assert (dist/'profiles'/r['i']/'index.html').is_file(), r['i']
    destination=dist/'data/discovery'; destination.mkdir(parents=True,exist_ok=True)
    def write(name,obj):
        data=encode(obj); (destination/name).write_bytes(data)
        return {'file':'/data/discovery/'+name,'bytes':len(data),'sha256':sha(data)}
    index=write('index.json',compact(all_rows,sha(raw)))
    shards=[]
    for i in range(64):
        key=f'{i:02x}'; records=sorted((r for r in all_rows if shard(r['i'])==key),key=lambda r:r['i'])
        shards.append({'id':key,'count':len(records),**write('profiles-'+key+'.json',compact(records,sha(raw),True))})
    output={'schemaVersion':'franklin.discovery-manifest.v1','community':'FRANKLIN_TN','sourceRelease':m['sourceRelease'],'sourceManifestSha256':sha(raw),'recordCount':len(all_rows),'index':index,'shards':shards,'factsChanged':False,'sourceVerificationDateAdvanced':False,'acceptanceInferred':False}
    manifest=write('manifest.json',output)
    return {'manifest':manifest,'indexBytes':index['bytes'],'largestShardBytes':max(x['bytes'] for x in shards),'recordCount':len(all_rows),'sourceManifestSha256':sha(raw),'sourceRelease':m['sourceRelease'],'shardCount':64}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--dist',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1]/'dist');args=parser.parse_args()
    print(json.dumps(build(args.dist),indent=2))
