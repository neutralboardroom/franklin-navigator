(() => {
  const root=document.querySelector('[data-profile-detail]'); if(!root)return;
  const status=root.querySelector('[data-profile-status]'), body=root.querySelector('[data-profile-body]');
  const label=v=>String(v||'').trim().replace(/[_-]+/g,' ').replace(/\s+/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  const params=new URLSearchParams(location.search), id=params.get('id');
  const load=async()=>{
    if(!id){status.textContent='Open a listing from the Franklin directory to view its profile.';return}
    status.textContent='Loading public profile…';
    const manifest=await fetch('/data/franklin-profiles-manifest.json').then(r=>r.json());
    for(const meta of manifest.chunks){const payload=await fetch(meta.file).then(r=>r.json());const row=payload.records.find(x=>x.i===id);if(!row)continue;
      document.title=`${row.n} | Franklin Navigator`;
      const canonicalUrl=`https://franklinnavigator.com/profile/?id=${encodeURIComponent(row.i)}`;
      let canonical=document.querySelector('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical)}canonical.href=canonicalUrl;
      const description=`${row.n} — ${label(row.c||row.t)} in ${row.l||'the Franklin area'}. Public Franklin Navigator profile; changing details should be confirmed directly.`;
      let meta=document.querySelector('meta[name="description"]');if(!meta){meta=document.createElement('meta');meta.name='description';document.head.append(meta)}meta.content=description;
      for(const [property,value] of [['og:title',`${row.n} | Franklin Navigator`],['og:description',description],['og:url',canonicalUrl]]){let tag=document.querySelector(`meta[property="${property}"]`);if(!tag){tag=document.createElement('meta');tag.setAttribute('property',property);document.head.append(tag)}tag.content=value}
      const schema=document.createElement('script');schema.type='application/ld+json';schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'LocalBusiness',name:row.n,url:canonicalUrl,address:row.l||undefined,sameAs:row.w?[row.w]:undefined});document.head.append(schema);
      status.hidden=true;body.hidden=false;body.querySelector('[data-profile-name]').textContent=row.n;body.querySelector('[data-profile-category]').textContent=label(row.c||row.t);body.querySelector('[data-profile-location]').textContent=row.l||'Franklin area';body.querySelector('[data-profile-area]').textContent=label(row.g);body.querySelector('[data-profile-checked]').textContent=row.d;
      const website=body.querySelector('[data-profile-website]');if(row.w){website.href=row.w;website.hidden=false}else website.hidden=true;
      const claim=body.querySelector('[data-profile-claim]');claim.href=`/claim-profile/?profile=${encodeURIComponent(row.i)}&chunk=${encodeURIComponent(row.x)}&source=profile-share`;
      const correction=body.querySelector('[data-profile-correction]');correction.href=`/corrections/?listing=${encodeURIComponent(row.n)}&url=${encodeURIComponent(canonicalUrl)}`;
      const share=body.querySelector('[data-profile-share]');if(share)share.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(canonicalUrl);share.textContent='Profile link copied'}catch{share.textContent='Copy this URL from your address bar'}});
      return;
    }
    status.textContent='This public profile was not found in the current Franklin projection.';
  };
  load().catch(()=>status.textContent='The public profile could not be loaded. Try the directory instead.');
})();
