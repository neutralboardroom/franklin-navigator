/* R1331 — make free profile-image ownership and upload action unmistakable */
(()=>{'use strict';
 const apply=()=>{
   document.querySelectorAll('.r1330-media-manager.is-free').forEach(section=>{
     const h=section.querySelector('h3');if(h)h.textContent='Upload your own profile photo or logo';
     const p=section.querySelector('h3 + p');if(p)p.textContent='Upload an image you own or have permission to publish. It stays private until you submit it and Franklin approves it. This free profile image does not require Community Membership.';
     const upload=section.querySelector('.r1330-media-upload');
     if(upload){
       const title=upload.querySelector('strong');if(title)title.textContent='Choose your own photo or logo';
       const help=upload.querySelector('.fine-print');if(help)help.textContent='JPG, PNG or WebP. Choose an image from your device; embedded metadata is removed and a web-safe copy is prepared before upload.';
       const btn=[...upload.querySelectorAll('button')].find(b=>/upload private draft/i.test(b.textContent||''));
       if(btn)btn.textContent='Upload your own image';
     }
   });
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
 new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
})();