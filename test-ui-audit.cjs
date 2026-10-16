"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
// 1. Lightweight DOM harness. Exercise page scripts without opening a browser.
// Number validity follows required/min/max/step attributes; this is not a visual/browser test.
function page(file,scripts){
 const html=fs.readFileSync(file,'utf8'),elements=new Map(),radios=[];
 class Element{
  constructor(attrs={}){this.attrs=attrs;this.value=attrs.value||'';this.defaultValue=this.value;this.textContent='';this.innerHTML='';this.hidden=false;this.listeners={};this.classList={toggle(){}};}
  setAttribute(k,v){this.attrs[k]=String(v);}setCustomValidity(s){this.custom=s;}
  addEventListener(k,fn){this.listeners[k]=fn;}focus(){}
  fire(k,extra={}){this.listeners[k]?.({target:this,preventDefault(){},...extra});}
  checkValidity(){const n=Number(this.value),a=this.attrs;if(this.custom||a.required!==undefined&&this.value==='')return false;
   if(!Number.isFinite(n)||a.min!==undefined&&n<Number(a.min)||a.max!==undefined&&n>Number(a.max))return false;
   if(a.step&&a.step!=='any'){const base=a.min!==undefined?Number(a.min):Number(this.defaultValue||0),steps=(n-base)/Number(a.step);if(Math.abs(steps-Math.round(steps))>1e-7)return false;}return true;}
 }
 const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(m=>[m[1],m[2]??'']));
 for(const m of html.matchAll(/<([\w-]+)\b([^>]*)>/g)){const a=attrs(m[2]);if(a.id)elements.set(a.id,new Element(a));if(a.type==='radio'){const el=new Element(a);el.name=a.name;el.checked=a.checked!==undefined;radios.push(el);}}
 for(const m of html.matchAll(/<textarea[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/textarea>/g))elements.get(m[1]).value=m[2];
 const get=id=>{if(!elements.has(id)){assert.equal(id,'toggle-ci');elements.set(id,new Element());}return elements.get(id);};
 const query=s=>{const name=s.match(/name="([^"]+)"/)[1],value=s.match(/value="([^"]+)"/)?.[1];return radios.find(r=>r.name===name&&(value?r.value===value:r.checked));};
 const document={getElementById:id=>id==='observed'&&!elements.has(id)?null:get(id),querySelector:query,querySelectorAll:s=>s.includes('radio')?radios:[...elements.values(),...radios].filter(e=>e.attrs.type||e.attrs.id==='observations'||['design','method'].includes(e.attrs.id))};
 if(file==='two-sample.html'){get('design').value='independent';get('method').value='pooled';}
 const context=vm.createContext({document});for(const script of scripts)vm.runInContext(fs.readFileSync(script,'utf8'),context);
 const select=(name,value)=>{for(const r of radios)if(r.name===name)r.checked=r.value===value;const el=query(`input[name="${name}"]:checked`);el.fire(file==='one-sample.html'?'change':'input');};
 const input=(id,value)=>{get(id).value=String(value);get(id).fire('input');};
 return {get,select,input};
}
function geometry(svg){return svg.replace(/<g class="ci-overlay"[\s\S]*<\/g>/,'');}
// 2. One-sample input precision, all directions/alphas/scales, toggles and reset.
const one=page('one-sample.html',['ttests.js','ttest-view.js','app.js']);
one.input('observed',107.123456789);assert(one.get('observed').checkValidity());assert.equal(one.get('observed').value,'107.123456789');
one.input('sd',15.123456789);assert(one.get('sd').checkValidity());
one.input('mean',100.123456789);assert(one.get('mean').checkValidity());
const p=one.get('result-p').textContent;
one.select('scale','original');assert(one.get('stat-value').innerHTML.startsWith('x&#x0305;'));assert.equal(one.get('result-p').textContent,p);
one.select('scale','standard');assert.equal(one.get('result-se').textContent,'1.000');
one.input('n',2.5);assert(!one.get('n').checkValidity());one.get('reset').fire('click');
one.input('sd',0);assert(!one.get('sd').checkValidity());one.get('reset').fire('click');assert(one.get('sd').checkValidity());
let combinations=0;
for(const kind of ['z','t'])for(const tail of ['two','left','right'])for(const alpha of ['0.10','0.05','0.01'])for(const scale of ['standard','original']){
 one.select('distribution',kind);one.select('tail',tail);one.select('alpha',alpha);one.select('scale',scale);
 assert.equal(one.get('ci-method-z').hidden,kind!=='z');assert.equal(one.get('ci-method-t').hidden,kind!=='t');
 const before=one.get('plot').innerHTML;one.get('toggle-ci').fire('click');const after=one.get('plot').innerHTML;
 assert.equal(geometry(before),geometry(after));assert(!/NaN/.test(after));assert.equal(one.get('interval-label').textContent,Math.round(100*(1-Number(alpha)))+'% confidence interval');
 assert.equal(one.get('mean-interval').textContent.includes('−∞'),tail==='left');assert.equal(one.get('mean-interval').textContent.includes(' ∞'),tail==='right');combinations++;
}
for(const tail of ['two','left','right'])for(const value of [0,1]){one.select('tail',tail);one.input('p-slider',value);assert(!/NaN/.test(one.get('plot').innerHTML));}
one.get('reset').fire('click');assert.equal(one.get('toggle-ci').textContent,'Show');assert(one.get('stat-value').innerHTML.startsWith('z ='));assert.equal(one.get('observed').value,'107');
// 3. Two-sample page: design/method changes, CI direction, stable axes, invalid input and reset.
const two=page('two-sample.html',['app.js','ttests.js','ttest-view.js','two-sample.js']);
for(const design of ['independent','paired'])for(const method of ['pooled','unequal','welch'])for(const tail of ['two','left','right'])for(const alpha of ['0.10','0.05','0.01'])for(const scale of ['standard','original']){
 two.select('scale',scale);two.input('design',design);two.input('method',method);two.select('tail',tail);two.select('alpha',alpha);assert(two.get('input-error').hidden,two.get('input-error').textContent);
 const before=two.get('two-plot').innerHTML;two.get('two-results').fire('click',{target:{id:'toggle-ci'}});assert.equal(geometry(before),geometry(two.get('two-plot').innerHTML));assert(!/NaN/.test(two.get('two-plot').innerHTML));
 assert(two.get('two-results').innerHTML.includes(Math.round(100*(1-Number(alpha)))+'% confidence interval'));combinations++;
}
// 4. Changing scale transforms labels/CI units only, preserving every plotted coordinate and result.
const Stats=require('./app.js'),TTests=require('./ttests.js');
const plotGeometry=svg=>svg.replace(/<title\b[^>]*>.*?<\/title>/g,'').replace(/<text\b[^>]*>.*?<\/text>/g,'').replace(/aria-label="[^"]*"/g,'');
for(const design of ['independent','paired'])for(const method of ['pooled','unequal','welch'])for(const multiplier of [1,-1,.00001,100000])for(const tail of ['two','left','right']){
 const pairs=[[20,24],[23,25],[21,21],[25,22]].map(p=>p.map(x=>x*multiplier));
 two.input('design',design);two.input('method',method);two.input('observations',pairs.map(p=>p.join(' ')).join('\n'));two.select('tail',tail);two.select('alpha','0.05');two.select('scale','standard');
 if(two.get('toggle-ci').textContent==='Show')two.get('two-results').fire('click',{target:{id:'toggle-ci'}});
 const standard=two.get('two-plot').innerHTML,results=two.get('two-results').innerHTML,data=two.get('data-plot').innerHTML,descriptives=two.get('descriptive-results').innerHTML;
 two.select('scale','original');const original=two.get('two-plot').innerHTML;
 assert.equal(plotGeometry(original),plotGeometry(standard));assert.equal(two.get('two-results').innerHTML,results);assert.equal(two.get('data-plot').innerHTML,data);assert.equal(two.get('descriptive-results').innerHTML,descriptives);
 const result=design==='paired'?TTests.paired(pairs):TTests.independent(TTests.summarize(pairs.map(p=>p[0])),TTests.summarize(pairs.map(p=>p[1])),method);
 assert(original.includes('Observed difference = '+Number(result.estimate.toPrecision(7))));
 const q=Stats.quantile(1-.05/(tail==='two'?2:1),'t',result.df),bound=tail==='left'?result.t+q:result.t-q;
 const extent=Math.max(4.4,q*1.3,Math.abs(result.t)*1.18,(tail==='two'?Math.max(Math.abs(result.t-q),Math.abs(result.t+q)):Math.abs(bound))*1.12);
 const ticks=[...original.matchAll(/<text x="([^"]+)" y="302"[^>]*>([^<]+)<\/text>/g)];assert.equal(ticks.length,5);
 ticks.forEach((m,i)=>assert.equal(Number(m[2]),Number(((i-2)*extent/2*result.se).toPrecision(4))));
 assert.equal(Number(ticks[2][1]),500);assert.equal(Number(ticks[2][2]),0);
 const ci=original.match(/class="ci-overlay"[^>]*aria-label="([^"]+)"/)[1];assert(ci.includes('original scale'));
 const expected=tail==='left'?result.estimate+q*result.se:result.estimate-q*result.se;
 assert(ci.includes(String(Number(expected.toPrecision(7)))));assert.equal(ci.includes('−∞'),tail==='left');assert.equal(ci.includes(' ∞'),tail==='right');
}
two.input('observations','1 1\n2 2');assert(!two.get('input-error').hidden);two.get('reset-two').fire('click');assert(two.get('input-error').hidden);assert.equal(two.get('toggle-ci').textContent,'Show');assert.equal(two.get('two-chart-title').textContent,'Student’s t distribution');
// 5. Descriptives: hand-calculated missing-data examples distinguish SD of differences from SD subtraction.
const tableRows=()=>[...two.get('descriptive-results').innerHTML.matchAll(/<tr><th scope="row">([^<]+)<\/th>((?:<td>[\s\S]*?<\/td>){3})<\/tr>/g)].map(m=>[m[1],...[...m[2].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(c=>c[1].replace(/<[^>]+>/g,''))]);
const display=n=>String(Number(n.toPrecision(7)));
const partial='1 2\n. 9\n4 3\n7 .\n6 8\n9 .';
two.input('observations',partial);
for(const design of ['paired','independent'])for(const method of ['pooled','unequal','welch'])for(const scale of ['standard','original'])for(const tail of ['two','left','right'])for(const alpha of ['0.10','0.05','0.01']){
 two.input('design',design);two.input('method',method);two.select('scale',scale);two.select('tail',tail);two.select('alpha',alpha);
 assert(two.get('input-error').hidden);
 const expected=design==='paired'?[
  ['Sample 1','3',display(11/3),display(Math.sqrt(19/3))],
  ['Sample 2','3',display(13/3),display(Math.sqrt(31/3))],
  ['Difference (Sample 1 - Sample 2)','3',display(-2/3),display(Math.sqrt(7/3))]
 ]:[
  ['Sample 1','5','5.4',display(Math.sqrt(9.3))],
  ['Sample 2','4','5.5',display(Math.sqrt(37/3))],
  ['Difference (Sample 1 - Sample 2)','—',display(-.1),'—']
 ];
 assert.deepEqual(tableRows(),expected);
}
two.input('design','independent');two.input('observations','5 1\n5 2\n5 4');assert.equal(tableRows()[0][3],'0');
two.input('observations','bad data');assert(two.get('two-output').hidden);two.get('reset-two').fire('click');
assert(!two.get('two-output').hidden);assert.equal(tableRows()[0][1],'12');assert.equal(tableRows()[2][3],'—');
const twoHtml=fs.readFileSync('two-sample.html','utf8');assert(twoHtml.indexOf('id="descriptive-results"')<twoHtml.indexOf('id="data-chart-title"'));
console.log('108 descriptive-table combinations passed, including unequal sample sizes, incomplete pairs, zero SD, invalid input, and reset.');
console.log(`${combinations} UI setting combinations passed, plus precision, invalid inputs, slider endpoints and reset checks (DOM harness; no browser).`);
