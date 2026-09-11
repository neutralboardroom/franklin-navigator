#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'dist/assets/hf39.js'
s=p.read_text(encoding='utf-8')
if 'function activitySummary(){' not in s:
    fn="""
function activitySummary(){if(!document.body.classList.contains('hf39-activities'))return;const n=q('[data-explorer-summary]');if(!n)return;const label='Activities & local options';let guard=false;const set=()=>{if(guard)return;if(String(n.textContent||'').trim()!==label){guard=true;n.textContent=label;guard=false}};new MutationObserver(set).observe(n,{subtree:true,childList:true,characterData:true});set();}
"""
    marker="document.addEventListener('DOMContentLoaded',()=>{taskFiltering();"
    if marker not in s:
        raise SystemExit('expected HF3.9 task-filter callback marker missing')
    s=s.replace(marker,fn+"\n"+"document.addEventListener('DOMContentLoaded',()=>{taskFiltering();activitySummary();",1)
    p.write_text(s,encoding='utf-8')
print('HF3.9 final activity-summary guard applied')
