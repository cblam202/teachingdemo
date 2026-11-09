"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('./correlation-stats.js'),TTests=require('./ttests.js');
const fixtures=JSON.parse(fs.readFileSync('validation/correlation-reference.json','utf8'));
let comparisons=0;
function near(actual,expected,label,relative=2e-9,absolute=1e-12) {
 comparisons++;
 if(expected==='Infinity'||expected==='-Infinity')return assert.equal(actual,Number(expected),label);
 assert(Number.isFinite(actual)&&Math.abs(actual-expected)<=absolute+relative*Math.abs(expected),`${label}: ${actual} versus ${expected}`);
}
// 1. Compare independent references for estimates, dispersion, p-values, cutoffs and CIs.
for(const fixture of fixtures.cases) {
 const result=C.calculate(fixture.pairs),prefix=fixture.name+': ';
 assert.equal(result.n,fixture.n);assert.equal(result.omitted,fixture.omitted);
 near(result.r,fixture.r,prefix+'r');near(result.rSquared,fixture.r**2,prefix+'R²');
 for(const name of ['slope','intercept','slopeSE','residualSD'])near(result[name],fixture[name],prefix+name,2e-9,fixture.name==='small-units'?1e-110:1e-12);
 for(const name of ['x','y'])for(const stat of ['mean','sd'])near(result[name][stat],fixture[name][stat],prefix+name+' '+stat,2e-9,fixture.name==='small-units'?1e-110:1e-12);
 for(const setting of fixture.settings) {
  const {tail,alpha}=setting,critical=C.critical(result.n,tail,alpha),ci=C.correlationInterval(result,tail,alpha),slopeCI=C.slopeInterval(result,tail,alpha);
  near(result.p[tail],setting.p,prefix+tail+' p',2e-8,1e-14);
  near(critical.t,setting.criticalT,prefix+'critical t');near(critical.r,setting.criticalR,prefix+'critical r');
  if(setting.ci===null)assert.equal(ci,null);else ci.forEach((bound,i)=>near(bound,setting.ci[i],prefix+'Fisher CI'));
  if(setting.slopeCI===null)assert.equal(slopeCI,null);else {
   slopeCI.forEach((bound,i)=>near(bound,setting.slopeCI[i],prefix+'slope CI'));
   near(result.slopeP[tail],setting.p,prefix+'slope p',2e-8,1e-14);
   if(tail==='two'&&Math.abs(setting.p-alpha)>1e-8)assert.equal(slopeCI[0]>0||slopeCI[1]<0,setting.p<alpha);
  }
 }
}
for(const fixture of fixtures.densities)near(C.density(fixture.r,fixture.n),fixture.density,'null r density',1e-8,1e-15);
// 2. Transformations preserve probabilities; swapping X/Y changes slope but not r.
const pairs=fixtures.cases[0].pairs,original=C.calculate(pairs),swapped=C.calculate(pairs.map(([x,y])=>[y,x]));
near(original.r,swapped.r,'swap symmetry');near(original.slope*swapped.slope,original.rSquared,'slope product');
for(const n of [3,4,12,1000])for(const r of [-.9999,-.5,0,.2,.9999])near(C.tToR(C.rToT(r,n-2),n-2),r,'r/t round trip');
assert.equal(C.rToT(1,10),Infinity);assert.equal(C.rToT(-1,10),-Infinity);
assert.equal(C.tToR(Infinity,10),1);assert.equal(C.tToR(-Infinity,10),-1);
const reversed=C.calculate(pairs.map(([x,y])=>[x,-y]));near(reversed.r,-original.r,'reverse sign');near(reversed.p.left,original.p.right,'reverse tail');
const shifted=C.calculate(pairs.map(([x,y])=>[x+1e10,y-1e10]));near(shifted.r,original.r,'location invariance');
for(const scale of [1e-150,1e-100,1e100,1e150]) {
 const scaled=C.calculate(pairs.map(([x,y])=>[x*scale,y*scale]));
 near(scaled.r,original.r,'extreme unit change r');near(scaled.slope,original.slope,'extreme unit change slope');
 near(scaled.slopeSE,original.slopeSE,'extreme unit change slope SE');near(scaled.p.two,original.p.two,'extreme unit change p');
}
// 3. Bad inputs never become apparently valid tests; missingness is by complete row.
for(const data of [[],[[1,2],[2,3]],[[1,2],[1,3],[1,4]],[[1,2],[2,2],[3,2]],[[1,2],[2,3],[NaN,4]],[[1,2],[2,3],[3,Infinity]]])assert.throws(()=>C.calculate(data));
const missing=C.calculate(TTests.parse('1 2\n. 9\n4 3\n7 .\n6 8\n9 6',2));assert.equal(missing.n,4);assert.equal(missing.x.n,4);assert.equal(missing.y.n,4);assert.equal(missing.omitted,2);
for(const bad of ['1 2 3','a b','1,\n2 3'])assert.throws(()=>TTests.parse(bad,2));
const scipyComparisons=comparisons;
// 4. Actual Stata 19 pwcorr/regress results, including incomplete rows and N=3.
const stataRows=fs.readFileSync('validation/correlation-stata.csv','utf8').trim().split('\n').slice(1);
for(const row of stataRows) {
 const [name,...values]=row.split(',').map(value=>value.trim());
 const result=C.calculate(fixtures.cases.find(fixture=>fixture.name===name).pairs),ci=C.slopeInterval(result,'two',.05);
 const actual=[result.n,result.df,result.r,result.slopeT,result.p.two,result.slope,result.intercept,result.slopeSE,result.residualSD,result.rSquared,...ci];
 actual.forEach((value,i)=>near(value,Number(values[i]),'Stata '+name+' field '+i));
}
console.log(`${scipyComparisons} numerical comparisons passed against ${fixtures.source}; ${fixtures.cases.length} datasets, missingness, transformations and invalid-input checks passed.`);
console.log(`${comparisons-scipyComparisons} comparisons passed against ${stataRows.length} actual Stata 19 cases.`);
