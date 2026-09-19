'use strict';
const crypto=require('node:crypto');
const VERSION='FRANKLIN_COMMUNITY_REVIEWS_1';
const COMMUNITY='FRANKLIN_TN';
const EXPERIENCE=new Set(['USED_SERVICE','CONSULTED','VISITED','PURCHASED','OTHER_FIRSTHAND']);
const REPORT_REASONS=new Set(['SPAM','NOT_FIRSTHAND','HARASSMENT','PRIVATE_INFO','CONFLICT_OF_INTEREST','OTHER']);
const fail=(code,message,status=400)=>{throw Object.assign(new Error(message||code),{code,status});};
const hash=v=>crypto.createHash('sha256').update(String(v||'')).digest('hex');
const oneLine=(v,max,min=0)=>{
  const s=String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
  if(s.length<min||s.length>max)fail('FIELD_INVALID','Check the review fields and try again.');
  return s;
};
const multiLine=(v,max,min=0)=>{
  const s=String(v??'').replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,' ').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
  if(s.length<min||s.length>max)fail('FIELD_INVALID','Check the review fields and try again.');
  return s;
};
function publicName(session){
  const raw=oneLine(session?.display_name||'',80);
  if(!raw)return 'Franklin user';
  const parts=raw.split(/\s+/).filter(Boolean);
  if(parts.length<2)return parts[0].slice(0,32);
  return (parts[0].slice(0,32)+' '+parts.at(-1).slice(0,1).toUpperCase()+'.').slice(0,40);
}
function holdReason(title,body){
  const text=(title+' '+body).toLowerCase();
  if(/https?:\/\/|www\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(text))return 'CONTACT_OR_EXTERNAL_LINK_REVIEW';
  if(/\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/.test(text))return 'PHONE_NUMBER_REVIEW';
  if(/\b(?:social security|ssn|credit card|bank account|account number|password|medical record|case number|docket number)\b/i.test(text))return 'PRIVATE_INFORMATION_REVIEW';
  if(/\b(?:fraud|scam|stole|theft|criminal|illegal|malpractice|abuse|assault|harass(?:ment|ed)?|discriminat\w*|racist|sexist|brib\w*|corrupt\w*|lied under oath)\b/i.test(text))return 'SERIOUS_ALLEGATION_REVIEW';
  return '';
}
function responseUnsafe(body){
  return /https?:\/\/|www\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|\b(?:social security|ssn|credit card|bank account|account number|password|medical record|case number|docket number)\b/i.test(body);
}
function createReviewSystem(d){
  const {query,tx,readBody,sendJson,requireSession,normalizeProfile,newId,audit,rateLimit,safeEqual,adminToken,profileNames}=d;
  const SELF_ID='FR-ORG-b00c0ace7943973c';
  const profile=id=>{
    const p=normalizeProfile(id);
    if(!Object.hasOwn(profileNames,p))fail('PROFILE_NOT_AVAILABLE','This Franklin profile is not available.',404);
    if(p===SELF_ID)fail('REVIEWS_NOT_AVAILABLE_FOR_FIRST_PARTY_PROFILE','Public ratings and reviews are not enabled for Franklin Navigator’s own first-party profile.',404);
    return p;
  };
  const send=(req,res,reqId,status,payload)=>{sendJson(req,res,status,{ok:true,...payload},reqId);return true;};
  async function summary(p){
    const row=(await query(`select count(*)::int review_count,coalesce(round(avg(rating)::numeric,1),0)::float average_rating,
      count(*) filter(where rating=5)::int five,count(*) filter(where rating=4)::int four,count(*) filter(where rating=3)::int three,
      count(*) filter(where rating=2)::int two,count(*) filter(where rating=1)::int one
      from franklin_reviews where profile_id=$1 and state='PUBLISHED'`,[p])).rows[0];
    return {count:Number(row?.review_count||0),average:Number(row?.average_rating||0),distribution:{5:Number(row?.five||0),4:Number(row?.four||0),3:Number(row?.three||0),2:Number(row?.two||0),1:Number(row?.one||0)}};
  }
  async function managerFor(accountId,p){
    return Boolean((await query("select 1 from franklin_profile_links where account_id=$1 and profile_id=$2 and authority_state='VERIFIED'",[accountId,p])).rowCount);
  }
  return {
    version:VERSION,
    async route(req,res,url,reqId){
      const publicPaths=new Set(['/api/reviews','/api/reviews/manage-status']);
      const memberPaths=new Set(['/api/reviews/submit','/api/reviews/report','/api/reviews/remove','/api/reviews/respond']);
      const adminPaths=new Set(['/admin/reviews','/admin/reviews/moderate']);
      if(!publicPaths.has(url.pathname)&&!memberPaths.has(url.pathname)&&!adminPaths.has(url.pathname))return false;

      if(req.method==='GET'&&url.pathname==='/api/reviews'){
        const p=profile(url.searchParams.get('profileId'));
        const sort=String(url.searchParams.get('sort')||'recent');
        const order=sort==='highest'?'rating desc,published_at desc':sort==='lowest'?'rating asc,published_at desc':'published_at desc,created_at desc';
        const limit=Math.max(1,Math.min(25,Number(url.searchParams.get('limit')||10)||10));
        const offset=Math.max(0,Math.min(5000,Number(url.searchParams.get('offset')||0)||0));
        const rows=(await query(`select review_id,rating,title,body,experience_type,public_name,owner_response,owner_response_at,published_at,created_at
          from franklin_reviews where profile_id=$1 and state='PUBLISHED' order by ${order} limit $2 offset $3`,[p,limit+1,offset])).rows;
        return send(req,res,reqId,200,{profileId:p,summary:await summary(p),reviews:rows.slice(0,limit).map(r=>({
          reviewId:r.review_id,rating:Number(r.rating),title:r.title,body:r.body,experienceType:r.experience_type,publicName:r.public_name,
          createdAt:r.published_at||r.created_at,ownerResponse:r.owner_response||'',ownerRespondedAt:r.owner_response_at||null
        })),nextOffset:rows.length>limit?offset+limit:null});
      }

      if(req.method==='GET'&&url.pathname==='/api/reviews/manage-status'){
        const p=profile(url.searchParams.get('profileId'));
        let session=null;try{session=await d.sessionFor(req)}catch{}
        return send(req,res,reqId,200,{profileId:p,signedIn:Boolean(session),canRespond:session?await managerFor(session.account_id,p):false});
      }

      if(adminPaths.has(url.pathname)){
        const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
        if(!adminToken||!safeEqual(token,adminToken))fail('ADMIN_AUTH_REQUIRED','Administrative authorization required.',401);
        if(req.method==='GET'&&url.pathname==='/admin/reviews'){
          const state=String(url.searchParams.get('state')||'PENDING').toUpperCase();
          if(!['PENDING','PUBLISHED','DISPUTED','REJECTED','REMOVED'].includes(state))fail('STATE_INVALID','Choose a valid review state.');
          const rows=(await query(`select review_id,profile_id,account_id,rating,title,body,experience_type,public_name,state,automated_hold_reason,moderation_reason,
            created_at,updated_at,published_at from franklin_reviews where state=$1 order by updated_at,review_id limit 100`,[state])).rows;
          return send(req,res,reqId,200,{state,reviews:rows.map(r=>({...r,profileName:profileNames[r.profile_id]?.name||'Franklin profile'}))});
        }
        if(req.method!=='POST'||url.pathname!=='/admin/reviews/moderate')fail('METHOD_NOT_ALLOWED','Method not allowed.',405);
        const b=await readBody(req),reviewId=oneLine(b.reviewId,100,8),decision=String(b.decision||'').toUpperCase();
        if(!['PUBLISH','REJECT','REMOVE','DISPUTE'].includes(decision))fail('DECISION_INVALID','Choose a valid moderation decision.');
        const reason=oneLine(b.reason||'',600,decision==='PUBLISH'?0:5);
        const next={PUBLISH:'PUBLISHED',REJECT:'REJECTED',REMOVE:'REMOVED',DISPUTE:'DISPUTED'}[decision];
        const result=await tx(async c=>{
          const row=(await c.query('select * from franklin_reviews where review_id=$1 for update',[reviewId])).rows[0];
          if(!row)fail('REVIEW_NOT_FOUND','Review not found.',404);
          await c.query(`update franklin_reviews set state=$2,moderation_reason=$3,published_at=case when $2='PUBLISHED' then coalesce(published_at,now()) else published_at end,
            removed_at=case when $2='REMOVED' then now() else removed_at end,updated_at=now() where review_id=$1`,[reviewId,next,reason]);
          await c.query('insert into franklin_review_history(decision_id,review_id,actor_type,actor_ref_hash,action,reason) values($1,$2,$3,$4,$5,$6)',
            [newId('reviewdecision'),reviewId,'ADMIN',hash(token),decision,reason]);
          await audit(c,'ADMIN',token,'REVIEW_'+decision,'REVIEW',reviewId,reqId,{profileId:row.profile_id});
          return {reviewId,state:next};
        });
        return send(req,res,reqId,200,result);
      }

      const session=await requireSession(req);
      const accountId=session.account_id;

      if(req.method==='POST'&&url.pathname==='/api/reviews/submit'){
        if(!rateLimit('reviews-submit:'+accountId,8,86400000))fail('RATE_LIMITED','You have reached the review limit for today.',429);
        const b=await readBody(req),p=profile(b.profileId);
        if(await managerFor(accountId,p))fail('CANNOT_REVIEW_OWN_PROFILE','Profile managers cannot review their own profile.',409);
        const existing=(await query("select review_id,state from franklin_reviews where account_id=$1 and profile_id=$2",[accountId,p])).rows[0];
        if(existing)fail('REVIEW_ALREADY_EXISTS','You already submitted a review for this profile.',409);
        const rating=Number(b.rating);if(!Number.isInteger(rating)||rating<1||rating>5)fail('RATING_INVALID','Choose a rating from 1 to 5.');
        const title=oneLine(b.title||'',120,0),body=multiLine(b.body,2400,40),experienceType=String(b.experienceType||'').toUpperCase();
        if(!EXPERIENCE.has(experienceType))fail('EXPERIENCE_INVALID','Choose how you interacted with this business or professional.');
        if(b.firsthandConfirmed!==true)fail('FIRSTHAND_CONFIRMATION_REQUIRED','Confirm that this review reflects your firsthand experience.');
        const hold=holdReason(title,body),state=hold?'PENDING':'PUBLISHED',id=newId('review'),name=publicName(session);
        await tx(async c=>{
          await c.query(`insert into franklin_reviews(review_id,community,profile_id,account_id,rating,title,body,experience_type,public_name,state,automated_hold_reason,published_at)
            values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,case when $10='PUBLISHED' then now() else null end)`,
            [id,COMMUNITY,p,accountId,rating,title,body,experienceType,name,state,hold]);
          await c.query('insert into franklin_review_history(decision_id,review_id,actor_type,actor_ref_hash,action,reason) values($1,$2,$3,$4,$5,$6)',
            [newId('reviewdecision'),id,'ACCOUNT',hash(accountId),state==='PUBLISHED'?'SUBMIT_PUBLISH':'SUBMIT_HOLD',hold]);
          await audit(c,'ACCOUNT',accountId,'COMMUNITY_REVIEW_SUBMITTED','PROFILE',p,reqId,{reviewId:id,rating,state,experienceType});
        });
        return send(req,res,reqId,201,{reviewId:id,state,message:state==='PUBLISHED'?'Your review is now visible.':'Your review was received and is being checked before publication.'});
      }

      if(req.method==='POST'&&url.pathname==='/api/reviews/report'){
        if(!rateLimit('reviews-report:'+accountId,20,86400000))fail('RATE_LIMITED','Too many reports. Try again later.',429);
        const b=await readBody(req),reviewId=oneLine(b.reviewId,100,8),reason=String(b.reason||'').toUpperCase();
        if(!REPORT_REASONS.has(reason))fail('REPORT_REASON_INVALID','Choose a reason for the report.');
        const detail=multiLine(b.detail||'',800,0);
        const review=(await query("select review_id,profile_id,state from franklin_reviews where review_id=$1",[reviewId])).rows[0];
        if(!review||review.state!=='PUBLISHED')fail('REVIEW_NOT_FOUND','Review not found.',404);
        await query(`insert into franklin_review_reports(report_id,review_id,account_id,reason,detail) values($1,$2,$3,$4,$5)
          on conflict(review_id,account_id) do update set reason=excluded.reason,detail=excluded.detail,created_at=now()`,
          [newId('reviewreport'),reviewId,accountId,reason,detail]);
        return send(req,res,reqId,201,{reported:true});
      }

      if(req.method==='POST'&&url.pathname==='/api/reviews/remove'){
        const b=await readBody(req),reviewId=oneLine(b.reviewId,100,8);
        const row=(await query("select review_id,profile_id from franklin_reviews where review_id=$1 and account_id=$2",[reviewId,accountId])).rows[0];
        if(!row)fail('REVIEW_NOT_FOUND','Review not found.',404);
        await query("update franklin_reviews set state='REMOVED',removed_at=now(),updated_at=now() where review_id=$1",[reviewId]);
        return send(req,res,reqId,200,{reviewId,state:'REMOVED'});
      }

      if(req.method==='POST'&&url.pathname==='/api/reviews/respond'){
        const b=await readBody(req),reviewId=oneLine(b.reviewId,100,8),response=multiLine(b.response,1200,10);
        const row=(await query("select review_id,profile_id,state from franklin_reviews where review_id=$1",[reviewId])).rows[0];
        if(!row||row.state!=='PUBLISHED')fail('REVIEW_NOT_FOUND','Review not found.',404);
        if(!(await managerFor(accountId,row.profile_id)))fail('PROFILE_VERIFICATION_REQUIRED','Verified profile management access is required.',403);
        if(responseUnsafe(response))fail('RESPONSE_PRIVATE_INFO','Keep public responses general and do not include contact details, case information, medical details, account information or other private data.',422);
        await query('update franklin_reviews set owner_response=$2,owner_response_account_id=$3,owner_response_at=now(),updated_at=now() where review_id=$1',[reviewId,response,accountId]);
        return send(req,res,reqId,200,{reviewId,responded:true});
      }

      fail('METHOD_NOT_ALLOWED','Method not allowed.',405);
    }
  };
}
module.exports={VERSION,createReviewSystem,_test:{holdReason,responseUnsafe,publicName}};
