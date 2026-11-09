"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./correlation-stats.js'),TTests=require('./ttests.js'),katex=require('./katex/katex.js');
// 1. Execute the real page scripts in a small DOM harness, without a browser or server.
const html=fs.readFileSync('correlation.html','utf8'),elements=new Map(),radios=[];
class Element {
 constructor(attrs={}) {this.attrs=attrs;this.id=attrs.id;this.value=attrs.value||'';this.checked=attrs.checked!==undefined;this.hidden=attrs.hidden!==undefined;this.disabled=false;this.innerHTML='';this.textContent='';this.listeners={};this.classes=new Set();this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};}
 setAttribute(key,value){this.attrs[key]=String(value);}addEventListener(key,fn){this.listeners[key]=fn;}
 fire(key){if(!this.disabled)this.listeners[key]?.({target:this});}
}
const attrs=text=>Object.fromEntries([...text.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(match=>[match[1],match[2]??'']));
for(const match of html.matchAll(/<([\w-]+)\b([^>]*)>/g)) {
 const a=attrs(match[2]),element=new Element(a);element.tag=match[1];
 if(a.id) {assert(!elements.has(a.id),'duplicate ID '+a.id);elements.set(a.id,element);}
 if(a.type==='radio')radios.push(element);
}
for(const match of html.matchAll(/<textarea[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/textarea>/g))elements.get(match[1]).value=match[2];
elements.get('analysis').value='correlation';
const get=id=>{if(id==='observed')return null;assert(elements.has(id),'missing element '+id);return elements.get(id);};
const query=selector=>{const name=selector.match(/name="([^"]+)"/)[1],value=selector.match(/value="([^"]+)"/)?.[1];return radios.find(r=>r.attrs.name===name&&(value?r.value===value:r.checked));};
const document={getElementById:get,querySelector:query,querySelectorAll:()=>[...elements.values(),...radios].filter(element=>['input','select','textarea'].includes(element.tag))};
const context=vm.createContext({document});
for(const name of ['app.js','ttests.js','ttest-view.js','correlation-stats.js','correlation.js'])vm.runInContext(fs.readFileSync(name,'utf8'),context);
const read=()=>JSON.parse(JSON.stringify(context.readTeachingDemo()));
const input=(id,value)=>{get(id).value=value;get(id).fire('input');};
const select=(name,value)=>{radios.forEach(r=>{if(r.attrs.name===name)r.checked=r.value===value;});query('input[name="'+name+'"]:checked').fire('input');};
const geometry=svg=>svg.replace(/<g class="ci-overlay"[\s\S]*?<\/g>/,'');
const valid=()=>{assert(get('input-error').hidden,get('input-error').textContent);assert(!get('correlation-output').hidden);assert(read().valid);};
const validGeometry=()=>{
 for(const id of ['scatter-plot','sampling-plot'])assert(!/(?:NaN|Infinity|undefined)/.test(get(id).innerHTML),'invalid SVG '+id);
};
valid();validGeometry();assert.equal(read().n,12);assert.equal(read().scale,'original');assert(get('sampling-title').textContent.includes('distribution of r'));
assert(!get('scatter-plot').innerHTML.includes('class="regression-line"'));assert(!get('sampling-plot').innerHTML.includes('ci-overlay'));

// 2. Controls retain raw precision and keep the two chart types, result units and tails aligned.
let combinations=0;
for(const data of [get('observations').value,'1 9\n2 7\n3 8\n4 3\n5 4','-2 4\n-1 1\n0 0\n1 1\n2 4','1 2\n. 7\n2 5\n4 .\n3 3\n4 7']) {
 input('observations',data);
 const expected=C.calculate(TTests.parse(data,2));
 for(const method of ['correlation','regression'])for(const tail of ['two','right','left'])for(const alpha of ['0.10','0.05','0.01'])for(const scale of ['original','standard']) {
  input('analysis',method);select('tail',tail);select('alpha',alpha);select('scale',scale);valid();validGeometry();
  const state=read(),regression=method==='regression',bounds=regression?C.slopeInterval(expected,tail,Number(alpha)):C.correlationInterval(expected,tail,Number(alpha));
  assert.equal(state.p,regression?expected.slopeP[tail]:expected.p[tail]);assert.deepEqual(state.confidenceInterval,JSON.parse(JSON.stringify(bounds)));
  assert.equal(get('method-correlation').hidden,regression);assert.equal(get('method-regression').hidden,!regression);
  assert(get('estimate-value').textContent.startsWith(scale==='standard'?'t =':regression?'b₁ =':'r ='));
  assert.equal(get('show-fit').disabled,regression);if(regression)assert(get('show-fit').checked);
  const before=get('sampling-plot').innerHTML;get('toggle-ci').fire('click');assert.equal(geometry(before),geometry(get('sampling-plot').innerHTML));
  assert.equal(get('interval-label').textContent,Math.round(100*(1-Number(alpha)))+'% confidence interval');
  if(scale==='original'&&!regression) {
   const ticks=[...get('sampling-plot').innerHTML.matchAll(/<text x="([^"]+)" y="302"[^>]*>([^<]+)<\/text>/g)];
   assert.deepEqual(ticks.map(t=>Number(t[2])),[-1,-.5,0,.5,1]);assert.equal(Number(ticks[2][1]),500);
  }
  combinations++;
 }
}
// 3. Clear stale results on invalid data; support N=3 and degenerate perfect fits honestly.
for(const data of ['','1 2\n2 3','1 2\n1 3\n1 4','1 2\n2 2\n3 2','hello world','1 2 3','1 Infinity']) {
 input('observations',data);assert(!get('input-error').hidden);assert(get('correlation-output').hidden);assert.equal(read().valid,false);
 get('reset-correlation').fire('click');valid();assert.equal(get('toggle-ci').textContent,'Show');
}
input('observations','1 2\n4 3\n6 8');valid();validGeometry();assert.equal(read().n,3);assert.equal(read().confidenceInterval,null);assert(get('toggle-ci').disabled);assert(!get('inference-note').hidden);
for(const scale of ['original','standard']){select('scale',scale);validGeometry();}
for(const data of ['1 3\n2 5\n3 7\n4 9','1 9\n2 7\n3 5\n4 3']) {
 input('analysis','correlation');input('observations',data);
 for(const scale of ['original','standard'])for(const tail of ['two','left','right']) {select('scale',scale);select('tail',tail);get('toggle-ci').fire('click');valid();validGeometry();}
 input('analysis','regression');valid();validGeometry();assert.equal(get('decision-value').textContent,'Not available');assert.equal(read().p,null);assert(get('sampling-plot').hidden);assert(get('toggle-ci').disabled);
}
get('reset-correlation').fire('click');valid();assert(!get('sampling-plot').hidden);assert(!get('show-fit').checked);assert(!get('show-fit').disabled);
get('show-fit').checked=true;get('show-fit').fire('input');assert(get('scatter-plot').innerHTML.includes('class="regression-line"'));
input('analysis','regression');input('analysis','correlation');assert(get('show-fit').checked);
get('reset-correlation').fire('click');assert(!get('show-fit').checked);assert.equal(get('observations').value,html.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/)[1]);
input('observations','1.123456789 2.123456789\n2.213456789 3.223456789\n3.323456789 2.343456789\n4.423456789 7.423456789');valid();assert(get('observations').value.includes('1.123456789'));validGeometry();
input('observations',Array.from({length:1001},(_,i)=>i+' '+(i+(i%3))).join('\n'));valid();assert.equal(read().n,1001);assert.equal((get('scatter-plot').innerHTML.match(/<circle /g)||[]).length,1000);assert(get('observation-note').textContent.includes('1,000'));validGeometry();

// 4. Navigation, local dependencies, and every methodology equation.
assert(fs.readFileSync('index.html','utf8').includes('href="correlation.html"'));
assert(html.indexOf('id="scatter-plot"')<html.indexOf('id="sampling-plot"'));
for(const match of html.matchAll(/(?:src|href)="([^"#:]+)"/g))if(!match[1].startsWith('http'))assert(fs.existsSync(match[1]),'missing asset '+match[1]);
for(const match of html.matchAll(/<annotation encoding="application\/x-tex">([^<]+)<\/annotation>/g))assert.doesNotThrow(()=>katex.renderToString(match[1],{throwOnError:true,trust:false}));
assert(!html.includes('chat.js'),'The removed local engine must not be loaded on the new page.');
assert(!('points' in read())&&!('observations' in read()),'summary must not contain raw observations');
console.log(`${combinations} UI combinations passed, plus CI geometry, missingness, invalid inputs, perfect fits, N=3, reset, scatterplot limits, links and KaTeX equations (no browser).`);
