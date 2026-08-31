import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const serverPath = path.join(root, 'server.js');
let source = fs.readFileSync(serverPath, 'utf8');

const commerceLine = "const COMMERCE_ENABLED = /^(1|true|yes|on)$/i.test(String(process.env.COMMERCE_ENABLED || 'false'));";
if (!source.includes(commerceLine)) {
  const anchor = "const ADMIN_TOKEN = String(process.env.ADMIN_TOKEN || '').trim();";
  if (!source.includes(anchor)) throw new Error('admin_token_anchor_missing');
  source = source.replace(anchor, `${anchor}\n${commerceLine}`);
}

const cookieLine = "function parseCookies(header){const out={};for(const part of String(header||'').split(';')){const i=part.indexOf('=');if(i>0)out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());}return out;}";
let cookieSeen = false;
source = source.split('\n').filter(line => {
  if (line !== cookieLine) return true;
  if (!cookieSeen) { cookieSeen = true; return true; }
  return false;
}).join('\n');
if (!cookieSeen) throw new Error('parse_cookies_missing');

const healthStart = "  if(req.method==='GET'&&url.pathname==='/health')";
const readyStart = "  if(req.method==='GET'&&url.pathname==='/ready')";
const catalogStart = "  if(req.method==='GET'&&url.pathname==='/api/catalog')";
const healthIndex = source.indexOf(healthStart);
const readyIndex = source.indexOf(readyStart);
const catalogIndex = source.indexOf(catalogStart);
if (healthIndex < 0 || readyIndex < 0 || catalogIndex < 0 || !(healthIndex < readyIndex && readyIndex < catalogIndex)) throw new Error('health_ready_route_boundary_missing');
const replacement = "  if(req.method==='GET'&&url.pathname==='/health')return sendJson(req,res,200,{ok:true,release:RELEASE,community:COMMUNITY,commerceEnabled:COMMERCE_ENABLED,databaseConfigured:Boolean(DATABASE_URL),uptimeSeconds:Math.floor(process.uptime())},reqId);\n" +
"  if(req.method==='GET'&&url.pathname==='/ready'){let database=false,links=0,migration=null;try{database=Boolean((await query('select 1 ok')).rowCount);links=Number((await query(`select count(*)::int n from franklin_payment_links where active=true`)).rows[0]?.n||0);migration=(await query(`select version,digest_sha256,applied_at from franklin_schema_migrations where version=$1`,[SCHEMA_VERSION])).rows[0]||null;}catch{}const cfg=configStatus();const infrastructureReady=cfg.ok&&database&&links===84&&Boolean(STRIPE_WEBHOOK_SECRET)&&Boolean(STRIPE_PORTAL_LOGIN_URL)&&Boolean(migration);return sendJson(req,res,infrastructureReady?200:503,{ok:infrastructureReady,release:RELEASE,community:COMMUNITY,schemaVersion:SCHEMA_VERSION,schemaDigest,migration,database,paymentLinkCount:links,stripeWebhookConfigured:Boolean(STRIPE_WEBHOOK_SECRET),portalLoginConfigured:Boolean(STRIPE_PORTAL_LOGIN_URL),commerceEnabled:COMMERCE_ENABLED,liveCheckoutEnabled:infrastructureReady&&COMMERCE_ENABLED,missing:cfg.missing,startupError:readyError?String(readyError.message||readyError):null},reqId);}\n";
source = source.slice(0, healthIndex) + replacement + source.slice(catalogIndex);

const startMarker = "  if(req.method==='POST'&&url.pathname==='/api/membership/start'){const session=";
if (!source.includes(startMarker) && !source.includes("COMMERCE_DISABLED")) throw new Error('membership_start_anchor_missing');
source = source.replace(startMarker, "  if(req.method==='POST'&&url.pathname==='/api/membership/start'){if(!COMMERCE_ENABLED)throw publicError('COMMERCE_DISABLED','Franklin Navigator membership checkout is not open yet.',423);const session=");
source = source.replace("module.exports={route,processCanonicalEvent,handleEvent,configStatus,normalizeProfile};", "module.exports={route,processCanonicalEvent,handleEvent,configStatus,normalizeProfile,commerceEnabled:COMMERCE_ENABLED};");

const parseCount = source.split(cookieLine).length - 1;
if (parseCount !== 1) throw new Error(`parse_cookie_count_${parseCount}`);
if (!source.includes('commerceEnabled:COMMERCE_ENABLED') || !source.includes("COMMERCE_DISABLED")) throw new Error('commerce_gate_not_applied');
fs.writeFileSync(serverPath, source);

fs.writeFileSync(path.join(root, '.env.example'), `LOCAL_RELEASE=FR-NAV1.2.0-CANDIDATE-R27\nPUBLIC_ORIGIN=https://franklinnavigator.com\nDATABASE_URL=\nSESSION_SECRET=\nLOCAL_ASSERTION_SECRET=\nSRE_SHARED_SECRET=\nSTRIPE_WEBHOOK_SECRET=\nSTRIPE_ACCOUNT_ID=acct_1TZU2TRxNra9nizo\nSTRIPE_PORTAL_LOGIN_URL=\nADMIN_TOKEN=\nSESSION_DAYS=14\nCOMMERCE_ENABLED=false\n`);

fs.writeFileSync(path.join(root, 'render.yaml'), `services:\n  - type: web\n    name: franklin-navigator-membership\n    runtime: node\n    region: virginia\n    plan: starter\n    branch: franklin-commerce-runtime\n    buildCommand: npm ci --ignore-scripts --no-audit --no-fund\n    startCommand: npm start\n    healthCheckPath: /health\n    autoDeploy: false\n    envVars:\n      - key: LOCAL_RELEASE\n        value: FR-NAV1.2.0-CANDIDATE-R27\n      - key: PUBLIC_ORIGIN\n        value: https://franklinnavigator.com\n      - key: DATABASE_URL\n        sync: false\n      - key: SESSION_SECRET\n        sync: false\n      - key: LOCAL_ASSERTION_SECRET\n        sync: false\n      - key: SRE_SHARED_SECRET\n        sync: false\n      - key: STRIPE_WEBHOOK_SECRET\n        sync: false\n      - key: STRIPE_ACCOUNT_ID\n        value: acct_1TZU2TRxNra9nizo\n      - key: STRIPE_PORTAL_LOGIN_URL\n        sync: false\n      - key: ADMIN_TOKEN\n        sync: false\n      - key: SESSION_DAYS\n        value: '14'\n      - key: COMMERCE_ENABLED\n        value: 'false'\n`);

fs.mkdirSync(path.join(root, 'evidence'), {recursive:true});
fs.writeFileSync(path.join(root, 'evidence', 'R27_RUNTIME_HARDENING_SOURCE_RECEIPT.json'), JSON.stringify({
  schemaVersion:'franklin.runtime-hardening-source-receipt.v1',
  release:'FR-NAV1.2.0-CANDIDATE-R27',
  workOrders:[
    'WO-20260829-LOCAL-FRANKLIN-R22-COMMERCE-INTEGRATION-022',
    'WO-20260830-LOCAL-FRANKLIN-R24-PERSISTENT-COMMERCE-AND-PRESELL-023',
    'WO-20260830-LOCAL-FRANKLIN-R24-LIVE-PAID-MEMBERSHIP-ACTIVATION-024',
    'WO-20260831-LOCAL-FRANKLIN-R26-RUNTIME-DEPLOY-AND-LIVE-PAYMENT-CUTOVER-025'
  ],
  changes:{packageLockRequired:true,commerceEnabledDefault:false,duplicateCookieParserRemoved:true,readyEvidenceExpanded:true,environmentNamesNormalized:true,workflowPathCorrected:'test/**'},
  realChargeCreated:false,
  authorityTransfer:false
}, null, 2)+'\n');

fs.writeFileSync(path.join(root, 'README.md'), `# Franklin Navigator commerce runtime\n\nFranklin-isolated account, session, subscription, entitlement, onboarding and support runtime for **FR-NAV1.2.0-CANDIDATE-R27**.\n\nThe runtime defaults to \`COMMERCE_ENABLED=false\`. A payment-link mapping, database connection or provider deployment cannot open checkout by itself. The Revenue Engine must accept the exact ready-stage receipt before Local enables the controlled transaction path.\n\nProduction requires the Franklin-only Render Postgres database, all 84 authorized self-service mappings, Enterprise quote-only behavior, signed Stripe/SRE event ingestion, Customer Portal access, restart persistence, backup/rollback evidence and a successful controlled real membership transaction before general checkout opens.\n`);

console.log(JSON.stringify({ok:true,release:'FR-NAV1.2.0-CANDIDATE-R27',commerceEnabledDefault:false,parseCookiesDefinitions:parseCount},null,2));
