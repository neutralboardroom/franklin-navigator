'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {plans,publicCatalog,getPlan,FOUNDING}=require('../lib/catalog');
test('catalog is exact 14 products and 84 recurring plans',()=>{const catalog=publicCatalog();assert.equal(catalog.productCount,14);assert.equal(catalog.selfServiceRecurringPriceCount,84);assert.equal(plans.length,84);assert.equal(new Set(plans.map(x=>x.lookupKey)).size,84);});
test('annual equals ten monthly and founding is 30 percent',()=>{for(const plan of plans){assert.equal(getPlan(plan.lookupKey),plan);assert.equal(plan.foundingUsd,Number((plan.regularUsd*.7).toFixed(2)));if(plan.interval==='ANNUAL'){const monthly=getPlan(plan.lookupKey.replace('_annual_','_monthly_'));assert.equal(plan.regularUsd,monthly.regularUsd*10);}}assert.equal(FOUNDING.percentOff,30);});
