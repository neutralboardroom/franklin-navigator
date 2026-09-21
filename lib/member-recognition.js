'use strict';

const VERSION='FRANKLIN_MEMBER_RECOGNITION_HF3_8';
const COMMUNITY='FRANKLIN_TN';
const FULFILLMENT_STATES=new Set(['NOT_ELIGIBLE','ELIGIBLE_ADDRESS_NEEDED','ELIGIBLE_READY','FULFILLMENT_REQUESTED','FULFILLED','REPLACEMENT_REVIEW','NOT_OFFERED','OUT_OF_STOCK']);
const ACTIVE_PROTECTED_FULFILLMENT=new Set(['FULFILLMENT_REQUESTED','FULFILLED','REPLACEMENT_REVIEW','OUT_OF_STOCK']);
const INACTIVE_PROTECTED_FULFILLMENT=new Set(['FULFILLED','REPLACEMENT_REVIEW','OUT_OF_STOCK']);
const ACTIVE_STATUSES=new Set(['ACTIVE','ACTIVE_CANCELING','GRACE']);

function currentRecognitionYear(now=Date.now()){
  const d=new Date(now); if(Number.isNaN(d.getTime()))throw Error('RECOGNITION_DATE_INVALID');
  return d.getUTCFullYear();
}
function activeAuthoritative(row,now=Date.now()){
  if(!row||row.account_state!=='ACTIVE'||row.authority_state!=='VERIFIED')return false;
  if(row.access_state!=='ACTIVE'||row.rich_profile!==true)return false;
  if(!ACTIVE_STATUSES.has(String(row.status||'')))return false;
  for(const v of [row.current_period_end,row.expires_at])if(v&&new Date(v).getTime()<=now)return false;
  return true;
}
function desiredFulfillmentStatus({active,programActive,addressConfirmed,currentStatus}){
  const prior=String(currentStatus||'');
  if(!active)return INACTIVE_PROTECTED_FULFILLMENT.has(prior)?prior:'NOT_ELIGIBLE';
  if(ACTIVE_PROTECTED_FULFILLMENT.has(prior))return prior;
  if(!programActive)return'NOT_OFFERED';
  return addressConfirmed?'ELIGIBLE_READY':'ELIGIBLE_ADDRESS_NEEDED';
}
function clean(value,max=160){return String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
function normalizeMailingAddress(input={}){
  const a={
    recipient:clean(input.recipient,120),
    line1:clean(input.line1,160),
    line2:clean(input.line2,160),
    city:clean(input.city,100),
    region:clean(input.region,80).toUpperCase(),
    postalCode:clean(input.postalCode,24).toUpperCase(),
    country:clean(input.country||'US',2).toUpperCase()
  };
  if(!a.recipient||!a.line1||!a.city||!a.region||!a.postalCode)throw Object.assign(new Error('MAILING_ADDRESS_REQUIRED'),{code:'MAILING_ADDRESS_REQUIRED',status:400});
  if(a.country!=='US')throw Object.assign(new Error('MAILING_COUNTRY_UNSUPPORTED'),{code:'MAILING_COUNTRY_UNSUPPORTED',status:400});
  return a;
}
function publicShape({profileId,profileName,history,currentActive,currentYear,updatedAt,publicOrigin}){
  const years=[...new Set((history||[]).map(Number).filter(Number.isInteger))].sort((a,b)=>b-a);
  return {
    community:COMMUNITY,
    profileId,
    profileName,
    profileUrl:`${publicOrigin}/profiles/${encodeURIComponent(profileId)}/`,
    verificationUrl:`${publicOrigin}/membership-verification/?profile=${encodeURIComponent(profileId)}`,
    currentMembershipActive:Boolean(currentActive),
    currentQualifyingYear:currentActive?currentYear:null,
    currentYearRecognitionActive:Boolean(currentActive&&years.includes(currentYear)),
    participationYears:years,
    lastVerifiedAt:updatedAt||null,
    explanation:'Franklin Navigator Community Membership participation recognition is not a government license, professional certification, quality guarantee, ranking, or endorsement.'
  };
}

function createMemberRecognition(d){
  const {query,tx,requireSession,readBody,sendJson,normalizeProfile,newId,audit,accessAllowed,safeEqual,adminToken,scope,publicOrigin}=d;
  const profiles=scope?.profiles||{};
  const programActive=/^(1|true|yes|on)$/i.test(String(d.programActive??process.env.FRANKLIN_DECAL_PROGRAM_ACTIVE??'false'));
  const pilotInventory=Math.max(0,Math.min(10000,Number(d.pilotInventory??process.env.FRANKLIN_DECAL_PILOT_INVENTORY??25)||0));
  function profile(value){const p=normalizeProfile(value);if(!Object.hasOwn(profiles,p))throw Object.assign(new Error('PROFILE_NOT_AVAILABLE'),{code:'PROFILE_NOT_AVAILABLE',status:404});return p;}
  function admin(req){const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!adminToken||!safeEqual(token,adminToken))throw Object.assign(new Error('ADMIN_AUTH_REQUIRED'),{code:'ADMIN_AUTH_REQUIRED',status:401});}
  async function membershipRow(c,{accountId=null,profileId=null}={}){
    const values=[];const where=[];
    if(accountId){values.push(accountId);where.push(`m.account_id=$${values.length}`)}
    if(profileId){values.push(profileId);where.push(`m.profile_id=$${values.length}`)}
    const r=(await c.query(`select m.membership_id,m.account_id,m.profile_id,m.status,m.current_period_end,m.updated_at as membership_updated_at,
      a.state as account_state,l.authority_state,e.access_state,e.rich_profile,e.expires_at
      from franklin_memberships m
      join franklin_accounts a using(account_id)
      join franklin_profile_links l on l.account_id=m.account_id and l.profile_id=m.profile_id
      left join franklin_entitlements e using(membership_id)
      where ${where.join(' and ')} order by m.updated_at desc limit 1`,values)).rows[0];
    return r||null;
  }
  async function ensureForMembership(c,row,{sourceEventKey=null,now=Date.now()}={}){
    if(!row)return null;
    const active=activeAuthoritative(row,now)&&accessAllowed(row.status,row.current_period_end,now);
    const year=currentRecognitionYear(now);
    if(!active){
      await c.query(`update franklin_member_recognition_years set recognition_state='HISTORICAL',last_authoritative_status=$2,updated_at=now() where profile_id=$1 and recognition_state='ACTIVE'`,[row.profile_id,String(row.status||'INACTIVE')]);
      const existing=(await c.query(`select * from franklin_member_recognition_years where profile_id=$1 order by recognition_year desc`,[row.profile_id])).rows;
      for(const rec of existing){
        const f=(await c.query('select * from franklin_member_decal_fulfillment where recognition_id=$1',[rec.recognition_id])).rows[0];
        if(f&&!INACTIVE_PROTECTED_FULFILLMENT.has(f.status))await c.query(`update franklin_member_decal_fulfillment set status='NOT_ELIGIBLE',updated_at=now() where fulfillment_id=$1`,[f.fulfillment_id]);
      }
      return {active:false,year,recognition:null};
    }
    await c.query(`update franklin_member_recognition_years set recognition_state='HISTORICAL',updated_at=now() where profile_id=$1 and recognition_year<>$2 and recognition_state='ACTIVE'`,[row.profile_id,year]);
    let rec=(await c.query(`insert into franklin_member_recognition_years(recognition_id,membership_id,account_id,profile_id,recognition_year,recognition_state,last_authoritative_status,source_event_key)
      values($1,$2,$3,$4,$5,'ACTIVE',$6,$7)
      on conflict(profile_id,recognition_year) do update set membership_id=excluded.membership_id,account_id=excluded.account_id,recognition_state='ACTIVE',last_qualified_at=now(),last_authoritative_status=excluded.last_authoritative_status,source_event_key=coalesce(excluded.source_event_key,franklin_member_recognition_years.source_event_key),updated_at=now()
      returning *`,[newId('recognition'),row.membership_id,row.account_id,row.profile_id,year,String(row.status||'ACTIVE'),sourceEventKey])).rows[0];
    let f=(await c.query(`insert into franklin_member_decal_fulfillment(fulfillment_id,recognition_id,membership_id,account_id,profile_id,recognition_year,status)
      values($1,$2,$3,$4,$5,$6,$7)
      on conflict(profile_id,recognition_year) do update set membership_id=excluded.membership_id,account_id=excluded.account_id,updated_at=now()
      returning *`,[newId('decal'),rec.recognition_id,row.membership_id,row.account_id,row.profile_id,year,programActive?'ELIGIBLE_ADDRESS_NEEDED':'NOT_OFFERED'])).rows[0];
    const desired=desiredFulfillmentStatus({active:true,programActive,addressConfirmed:Boolean(f.mailing_address_confirmed_at),currentStatus:f.status});
    if(desired!==f.status)f=(await c.query(`update franklin_member_decal_fulfillment set status=$2,updated_at=now() where fulfillment_id=$1 returning *`,[f.fulfillment_id,desired])).rows[0];
    return {active:true,year,recognition:rec,fulfillment:f};
  }
  async function snapshotForProfile(c,p){
    const row=await membershipRow(c,{profileId:p});
    const ensured=await ensureForMembership(c,row||{profile_id:p,status:'INACTIVE',account_state:'INACTIVE',authority_state:'PENDING',access_state:'INACTIVE',rich_profile:false});
    const history=(await c.query(`select recognition_year,recognition_state,updated_at from franklin_member_recognition_years where profile_id=$1 order by recognition_year desc`,[p])).rows;
    const latest=history[0];
    return publicShape({profileId:p,profileName:profiles[p].name,history:history.map(x=>x.recognition_year),currentActive:Boolean(ensured?.active),currentYear:currentRecognitionYear(),updatedAt:latest?.updated_at||row?.membership_updated_at||null,publicOrigin});
  }
  async function memberSnapshot(c,accountId){
    const row=await membershipRow(c,{accountId});
    if(!row)return{activePaidMember:false,recognition:null,history:[],fulfillment:null,program:{active:programActive,pilotInventory}};
    const ensured=await ensureForMembership(c,row);
    const history=(await c.query(`select recognition_year,recognition_state,qualified_at,last_qualified_at from franklin_member_recognition_years where profile_id=$1 order by recognition_year desc`,[row.profile_id])).rows;
    const f=ensured?.recognition?(await c.query(`select fulfillment_id,recognition_year,status,mailing_address_confirmed_at,requested_at,fulfilled_at,quantity_fulfilled,replacement_requested_at from franklin_member_decal_fulfillment where recognition_id=$1`,[ensured.recognition.recognition_id])).rows[0]:null;
    return{activePaidMember:Boolean(ensured?.active),profileId:row.profile_id,profileName:profiles[row.profile_id]?.name||row.profile_id,recognition:ensured?.active?{year:ensured.year,label:`${ensured.year} Franklin Navigator Community Member`,verificationUrl:`${publicOrigin}/membership-verification/?profile=${encodeURIComponent(row.profile_id)}`} : null,history:history.map(x=>({year:x.recognition_year,state:x.recognition_state,qualifiedAt:x.qualified_at,lastQualifiedAt:x.last_qualified_at})),fulfillment:f?{...f,addressConfirmed:Boolean(f.mailing_address_confirmed_at)}:null,program:{active:programActive,pilotInventory}};
  }
  async function syncMembership(c,membership,{eventKey=null}={}){
    if(!membership?.membership_id)return null;
    const row=await membershipRow(c,{accountId:membership.account_id,profileId:membership.profile_id});
    return ensureForMembership(c,row,{sourceEventKey:eventKey});
  }
  async function metrics(){
    const r=await query(`select
      (select count(*)::int from franklin_member_recognition_years where recognition_year=$1 and recognition_state='ACTIVE') current_year_digital,
      (select count(*)::int from franklin_member_decal_fulfillment where recognition_year=$1 and status in ('ELIGIBLE_ADDRESS_NEEDED','ELIGIBLE_READY','FULFILLMENT_REQUESTED','FULFILLED','REPLACEMENT_REVIEW','OUT_OF_STOCK')) decal_eligible,
      (select count(*)::int from franklin_member_decal_fulfillment where recognition_year=$1 and status='ELIGIBLE_ADDRESS_NEEDED') address_needed,
      (select count(*)::int from franklin_member_decal_fulfillment where recognition_year=$1 and status='FULFILLMENT_REQUESTED') fulfillment_requested,
      (select count(*)::int from franklin_member_decal_fulfillment where recognition_year=$1 and status='FULFILLED') fulfilled,
      (select count(*)::int from franklin_member_decal_fulfillment where recognition_year=$1 and status='REPLACEMENT_REVIEW') replacements_requested,
      (select count(*)::int from franklin_member_recognition_years) participation_year_records`,[currentRecognitionYear()]);
    return{community:COMMUNITY,currentYear:currentRecognitionYear(),programActive,pilotInventory,...r.rows[0]};
  }
  async function route(req,res,url,reqId){
    const path=url.pathname;
    const owned=new Set(['/api/member/public-recognition','/api/member/recognition','/api/member/recognition/mailing-address','/api/member/recognition/decal-request','/api/member/recognition/replacement-request','/internal/member-recognition/metrics','/internal/member-recognition/fulfillment']);
    if(!owned.has(path))return false;
    const send=(status,obj)=>{sendJson(req,res,status,{ok:true,...obj},reqId);return true;};
    if(req.method==='GET'&&path==='/api/member/public-recognition'){
      const p=profile(url.searchParams.get('profileId'));return send(200,{recognition:await tx(c=>snapshotForProfile(c,p))});
    }
    if(req.method==='GET'&&path==='/api/member/recognition'){
      const s=await requireSession(req);return send(200,{recognition:await tx(c=>memberSnapshot(c,s.account_id))});
    }
    if(req.method==='POST'&&path==='/api/member/recognition/mailing-address'){
      const s=await requireSession(req),body=await readBody(req),address=normalizeMailingAddress(body.address||body);
      const result=await tx(async c=>{const row=await membershipRow(c,{accountId:s.account_id});const ensured=await ensureForMembership(c,row);if(!ensured?.active)throw Object.assign(new Error('ACTIVE_MEMBERSHIP_REQUIRED'),{code:'ACTIVE_MEMBERSHIP_REQUIRED',status:403});const f=ensured.fulfillment;if(!f)throw Error('FULFILLMENT_STATE_MISSING');const desired=desiredFulfillmentStatus({active:true,programActive,addressConfirmed:true,currentStatus:f.status});const next=(await c.query(`update franklin_member_decal_fulfillment set mailing_address=$2::jsonb,mailing_address_confirmed_at=now(),status=$3,updated_at=now() where fulfillment_id=$1 returning fulfillment_id,recognition_year,status,mailing_address_confirmed_at,requested_at,fulfilled_at,quantity_fulfilled,replacement_requested_at`,[f.fulfillment_id,JSON.stringify(address),desired])).rows[0];await audit(c,'ACCOUNT',s.account_id,'RECOGNITION_MAILING_ADDRESS_CONFIRMED','PROFILE',row.profile_id,reqId,{year:ensured.year});return next;});
      return send(200,{fulfillment:{...result,addressConfirmed:true}});
    }
    if(req.method==='POST'&&path==='/api/member/recognition/decal-request'){
      const s=await requireSession(req);
      const result=await tx(async c=>{const row=await membershipRow(c,{accountId:s.account_id});const ensured=await ensureForMembership(c,row);if(!ensured?.active)throw Object.assign(new Error('ACTIVE_MEMBERSHIP_REQUIRED'),{code:'ACTIVE_MEMBERSHIP_REQUIRED',status:403});if(!programActive)throw Object.assign(new Error('DECAL_PROGRAM_NOT_OFFERED'),{code:'DECAL_PROGRAM_NOT_OFFERED',status:409});const f=(await c.query('select * from franklin_member_decal_fulfillment where recognition_id=$1 for update',[ensured.recognition.recognition_id])).rows[0];if(!f.mailing_address_confirmed_at)throw Object.assign(new Error('MAILING_ADDRESS_CONFIRMATION_REQUIRED'),{code:'MAILING_ADDRESS_CONFIRMATION_REQUIRED',status:409});if(f.status==='FULFILLED'||f.status==='FULFILLMENT_REQUESTED')return f;if(f.status==='OUT_OF_STOCK')throw Object.assign(new Error('DECAL_OUT_OF_STOCK'),{code:'DECAL_OUT_OF_STOCK',status:409});const next=(await c.query(`update franklin_member_decal_fulfillment set status='FULFILLMENT_REQUESTED',requested_at=coalesce(requested_at,now()),updated_at=now() where fulfillment_id=$1 returning *`,[f.fulfillment_id])).rows[0];await audit(c,'ACCOUNT',s.account_id,'DECAL_FULFILLMENT_REQUESTED','PROFILE',row.profile_id,reqId,{year:ensured.year,quantity:1});return next;});
      return send(200,{fulfillment:{recognitionYear:result.recognition_year,status:result.status,requestedAt:result.requested_at,quantityFulfilled:result.quantity_fulfilled}});
    }
    if(req.method==='POST'&&path==='/api/member/recognition/replacement-request'){
      const s=await requireSession(req);
      const result=await tx(async c=>{const row=await membershipRow(c,{accountId:s.account_id});const ensured=await ensureForMembership(c,row);if(!ensured?.active)throw Object.assign(new Error('ACTIVE_MEMBERSHIP_REQUIRED'),{code:'ACTIVE_MEMBERSHIP_REQUIRED',status:403});const f=(await c.query('select * from franklin_member_decal_fulfillment where recognition_id=$1 for update',[ensured.recognition.recognition_id])).rows[0];if(f.status!=='FULFILLED')throw Object.assign(new Error('REPLACEMENT_NOT_AVAILABLE'),{code:'REPLACEMENT_NOT_AVAILABLE',status:409});const next=(await c.query(`update franklin_member_decal_fulfillment set status='REPLACEMENT_REVIEW',replacement_requested_at=coalesce(replacement_requested_at,now()),updated_at=now() where fulfillment_id=$1 returning *`,[f.fulfillment_id])).rows[0];await audit(c,'ACCOUNT',s.account_id,'DECAL_REPLACEMENT_REVIEW_REQUESTED','PROFILE',row.profile_id,reqId,{year:ensured.year});return next;});
      return send(200,{fulfillment:{recognitionYear:result.recognition_year,status:result.status,replacementRequestedAt:result.replacement_requested_at}});
    }
    if(path==='/internal/member-recognition/metrics'){
      admin(req);if(req.method!=='GET')return false;return send(200,{metrics:await metrics()});
    }
    if(path==='/internal/member-recognition/fulfillment'){
      admin(req);if(req.method!=='POST')return false;const body=await readBody(req),id=clean(body.fulfillmentId,120),status=String(body.status||'').toUpperCase();if(!/^decal_[A-Za-z0-9]+$/.test(id)||!FULFILLMENT_STATES.has(status))throw Object.assign(new Error('FULFILLMENT_UPDATE_INVALID'),{code:'FULFILLMENT_UPDATE_INVALID',status:400});
      const row=(await query(`update franklin_member_decal_fulfillment set status=$2,fulfilled_at=case when $2='FULFILLED' then coalesce(fulfilled_at,now()) else fulfilled_at end,quantity_fulfilled=case when $2='FULFILLED' then 1 else quantity_fulfilled end,internal_note=$3,updated_at=now() where fulfillment_id=$1 returning fulfillment_id,profile_id,recognition_year,status,fulfilled_at,quantity_fulfilled`,[id,status,clean(body.note,500)||null])).rows[0];if(!row)throw Object.assign(new Error('FULFILLMENT_NOT_FOUND'),{code:'FULFILLMENT_NOT_FOUND',status:404});return send(200,{fulfillment:row});
    }
    return false;
  }
  return Object.freeze({version:VERSION,programActive,pilotInventory,route,syncMembership,snapshotForProfile,memberSnapshot,metrics});
}

module.exports={VERSION,COMMUNITY,FULFILLMENT_STATES,currentRecognitionYear,activeAuthoritative,desiredFulfillmentStatus,normalizeMailingAddress,publicShape,createMemberRecognition};
