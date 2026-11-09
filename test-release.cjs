"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const katex=require('./katex/katex.js'),root=process.cwd(),pages=['index.html','one-sample.html','two-sample.html','correlation.html'];
let assets=0,equations=0;
const scripts=new Set(),styles=new Set();
// 1. Check the actual published pages and exact filename case for GitHub Pages.
function localFile(reference,from) {
 const filename=decodeURIComponent(reference.split(/[?#]/)[0]),target=path.resolve(path.dirname(from),filename);
 assert(target.startsWith(root+path.sep),'Asset outside the site: '+reference);
 assert(fs.statSync(target).isFile(),'Missing local asset: '+reference);
 let parent=root;
 for(const part of path.relative(root,target).split(path.sep)) {
  assert(fs.readdirSync(parent).includes(part),'Incorrect filename case: '+reference);parent=path.join(parent,part);
 }
 assets++;return target;
}
for(const page of pages) {
 const html=fs.readFileSync(page,'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(ids.length,new Set(ids).size,'Duplicate IDs in '+page);
 assert(html.includes('<html lang="en">'));assert(html.includes('name="viewport"'));
 for(const match of html.matchAll(/\b(?:href|src)="([^"#]+)"/g)) {
  if(/^(?:https?:|mailto:)/.test(match[1]))continue;
  const file=localFile(match[1],path.resolve(page));
  if(file.endsWith('.js'))scripts.add(file);if(file.endsWith('.css'))styles.add(file);
 }
 for(const match of html.matchAll(/<annotation encoding="application\/x-tex">([^<]+)<\/annotation>/g)) {
  katex.renderToString(match[1],{throwOnError:true,trust:false,strict:'error'});equations++;
 }
 assert(!/\b(?:src|href)="chat(?:-context)?\.(?:js|css)"/.test(html),'Inactive assistant is attached to '+page);
 if(page!=='index.html')assert(html.includes('href="index.html"'),'Missing home navigation in '+page);
}
const home=fs.readFileSync('index.html','utf8');
for(const page of pages.slice(1))assert(home.includes('href="'+page+'"'),'Missing landing-page choice: '+page);
// 2. Every bundled font exists, and all active scripts parse without external setup.
for(const file of styles)for(const match of fs.readFileSync(file,'utf8').matchAll(/url\(["']?([^\s)"']+)["']?\)/g)) {
 assert(!/^(?:https?:|\/\/)/.test(match[1]),'Remote CSS asset: '+match[1]);
 if(!match[1].startsWith('data:'))localFile(match[1],file);
}
for(const file of scripts) {
 const code=fs.readFileSync(file,'utf8');new vm.Script(code,{filename:file});
 // KaTeX's parser.fetch() reads a math token, not a network resource; reviewed separately.
 if(!file.includes(path.sep+'katex'+path.sep))assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|Worker|sendBeacon)\s*\(/.test(code),'Unexpected network/worker call in '+path.basename(file));
}
assert(fs.existsSync('.nojekyll'));
assert(fs.readFileSync('katex/LICENSE.txt','utf8').includes('Permission is hereby granted'));
console.log(`Release checks passed: ${pages.length} pages, ${scripts.size} active scripts, ${assets} local asset references, ${equations} KaTeX equations, navigation, font files, and inactive assistant.`);
