"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Stats=require('./app.js'),TTests=require('./ttests.js');
const context=vm.createContext({Stats});vm.runInContext(fs.readFileSync('ttest-view.js','utf8')+'\nglobalThis.view=TTestView;',context);const view=context.view;
let comparisons=0,maxError=0;
function near(actual,expected,label,tolerance=1e-9){const error=Math.abs(actual-expected)/Math.max(1,Math.abs(expected));assert(Number.isFinite(actual)&&error<=tolerance,`${label}: ${actual} vs ${expected}`);maxError=Math.max(maxError,error);comparisons++;}
// 1. Independent distribution values, including very small probabilities and low/fractional df.
for(const r of require('./validation/scipy-audit.json'))near(Stats[r.op](r.x,r.kind,r.df),r.value,JSON.stringify(r));
// 2. Actual Stata ztesti/ttesti output, two-sided CIs, and independently computed one-sided bounds.
const cases=require('./validation/audit-cases.json');
const rows=fs.readFileSync('validation/stata-audit.csv','utf8').trim().split('\n').slice(1);assert.equal(rows.length,cases.length);
for(const row of rows){
 const [id,...expected]=row.split(',').map(Number),c=cases[id],kind=c.method==='z'?'z':'t';let r;
 if(kind==='z'){
  const se=c.first.sd/Math.sqrt(c.first.n),t=(c.first.mean-c.nullMean)/se;
  r={t,df:0,se,estimate:c.first.mean,p:{two:Stats.pValue(t,'two','z'),left:Stats.pValue(t,'left','z'),right:Stats.pValue(t,'right','z')}};
 }else r=c.method==='one'?TTests.one(c.first,c.nullMean,c.level):TTests.independent(c.first,c.second,c.method,c.level);
 const alpha=1-c.level/100,bounds=view.interval(r.estimate,r.se,kind,r.df,'two',alpha);
 const actual=[r.t,r.df,r.se,r.p.two,r.p.left,r.p.right,...bounds,view.interval(r.estimate,r.se,kind,r.df,'right',alpha)[0],view.interval(r.estimate,r.se,kind,r.df,'left',alpha)[1]];
 actual.forEach((x,i)=>near(x,expected[i],`Stata case ${id}, column ${i}`));
 for(let i=3;i<=5;i++)if(kind==='t'&&expected[i]>0&&expected[i]<1e-8)assert(Math.abs(actual[i]/expected[i]-1)<1e-8,`Relative accuracy of tiny Stata p-value ${id} ${i}: ${actual[i]} vs ${expected[i]}`);
}
// 3. CI/test duality immediately around each critical value; original-scale equivalence.
for(const kind of ['z','t'])for(const df of [1,2,24,134,10000])for(const tail of ['two','left','right'])for(const alpha of [.1,.05,.01]){
 const q=Stats.quantile(1-alpha/(tail==='two'?2:1),kind,df);
 for(const sign of [-1,1])for(const delta of [-1e-6,1e-6]){
  const x=sign*(q+delta),bounds=view.interval(x,1,kind,df,tail,alpha);
  assert.equal(bounds[0]>0||bounds[1]<0,Stats.pValue(x,tail,kind,df)<alpha);
  const raw=view.interval(100+3*x,3,kind,df,tail,alpha);
  bounds.forEach((b,i)=>Number.isFinite(b)?near(raw[i],100+3*b,'CI scale conversion'):assert.equal(raw[i],b));
 }
}
assert.equal(view.intervalText([-Infinity,2]),'(−∞, 2]');assert.equal(view.intervalText([2,Infinity]),'[2, ∞)');
for(const alpha of [.1,.05,.01])for(const delta of [-1e-6,1e-6,-1e-10,1e-10]){
 const p=alpha+delta,displayed=Number(view.probability(p,alpha));assert.equal(displayed<alpha,p<alpha);assert.notEqual(displayed,alpha);
}
// 4. Parsing and paired deletion; swapping samples and shifting both samples.
const pairs=TTests.parse('1.123456789 2.1\n. 4\n3.5 .a\n5.9 4.4\n9.7 8.2',2);
const paired=TTests.paired(pairs);assert.equal(paired.rows[0].n,3);assert.equal(paired.omitted,2);
const reversed=TTests.paired(pairs.map(([a,b])=>[b,a]));near(reversed.t,-paired.t,'Pair reversal');near(reversed.p.left,paired.p.right,'Tail reversal');
const shifted=TTests.paired(pairs.map(p=>p.map(v=>v===null?null:v+1000)));near(shifted.t,paired.t,'Location invariance');
for(const text of ['1,,2','1 cat','1 2 3','','Infinity 3','1e999 2'])assert.throws(()=>TTests.parse(text,2));
assert.throws(()=>TTests.paired([[1,1],[2,2]]),/standard error/);
console.log(`${comparisons} audit numerical comparisons passed; ${cases.length} new Stata cases. Maximum normalized error ${maxError}.`);
