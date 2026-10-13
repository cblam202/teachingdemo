"use strict";

// 1. Sample inputs and display helpers.
(() => {
  const $=id=>document.getElementById(id), fuel=$("observations").value;
  const fmt=TTestView.number;
  let showCI=false;
  function tag(name,attrs,content="") {
    return "<"+name+" "+Object.entries(attrs).map(([key,value])=>key+'="'+value+'"').join(" ")+">"+content+"</"+name+">";
  }
  const text=(x,y,value,anchor="middle")=>tag("text",{x,y,"text-anchor":anchor},value);
  const line=(x1,y1,x2,y2,color,dash="")=>tag("line",{x1,y1,x2,y2,stroke:color,"stroke-width":1.5,"stroke-dasharray":dash});
  // 2. Null reference distribution and confidence interval for the selected direction.
  function drawTest(result,tail,alpha) {
    const critical=Stats.quantile(1-alpha/(tail==="two"?2:1),"t",result.df);
    const bounds=TTestView.interval(result.t,1,"t",result.df,tail,alpha);
    const domain=Math.max(4.4,critical*1.3,Math.abs(result.t)*1.18,Math.max(...bounds.filter(Number.isFinite).map(Math.abs))*1.12),base=270;
    $("toggle-ci").textContent=showCI?"Hide":"Show";
    $("toggle-ci").setAttribute("aria-pressed",String(showCI));
    $("toggle-ci").setAttribute("aria-label",(showCI?"Hide":"Show")+" confidence interval on the plot");
    const px=x=>65+(x+domain)/(2*domain)*870;
    const py=x=>base-Stats.pdf(x,"t",result.df)/Stats.pdf(0,"t",result.df)*210;
    function path(a,b,fill) {
      a=Math.max(a,-domain);b=Math.min(b,domain);
      if (a>=b) return "";
      let d="M "+px(a)+" "+(fill?base:py(a));
      for(let i=0;i<=800;i++) {const x=a+(b-a)*i/800;d+=" L "+px(x)+" "+py(x);}
      return d+(fill?" L "+px(b)+" "+base+" Z":"");
    }
    const bands=tail==="two"?[[-domain,-critical],[critical,domain]]:tail==="left"?[[-domain,-critical]]:[[critical,domain]];
    const areas=tail==="two"?[[-domain,-Math.abs(result.t)],[Math.abs(result.t),domain]]:tail==="left"?[[-domain,result.t]]:[[result.t,domain]];
    let svg=tag("title",{},"Student’s t distribution; "+tail+"-tailed p-value "+result.p[tail]);
    bands.forEach(([a,b])=>{svg+=tag("path",{d:path(a,b,true),fill:"#efb8bc"})+tag("rect",{x:px(a),y:base+4,width:px(b)-px(a),height:2,fill:"#c44248"});});
    areas.forEach(([a,b])=>{svg+=tag("path",{d:path(a,b,true),fill:"#9270b9","fill-opacity":.75});});
    svg+=tag("path",{d:path(-domain,domain,false),fill:"none",stroke:"#001641","stroke-width":2.5})+line(65,base,935,base,"#8b98ab");
    svg+=line(px(0),60,px(0),base,"#bcc5d2","4 6");
    for(let i=-2;i<=2;i++) {const value=i*domain/2;svg+=text(px(value),base+32,Number(value.toFixed(2)));}
    svg+=line(px(result.t),40,px(result.t),base,"#001641","5 4")+text(Math.max(145,Math.min(855,px(result.t))),25,"Observed t = "+result.t.toFixed(4));
    svg+=tag("circle",{cx:px(result.t),cy:base,r:6,fill:"#001641"});
    svg+=text(500,base+70,"Standardized statistic (t)");
    if(showCI) {
      const y=base+17;
      svg+=tag("g",{class:"ci-overlay",role:"img","aria-label":result.level+"% confidence interval on the standardized scale: "+TTestView.intervalText(bounds)},
        line(px(Math.max(-domain,bounds[0])),y,px(Math.min(domain,bounds[1])),y,"#176b57")
        +bounds.map(value=>{
          if(Number.isFinite(value)) return line(px(value),y-5,px(value),y+5,"#176b57");
          const edge=value<0?65:935,inward=value<0?7:-7;
          return line(edge+inward,y-5,edge,y,"#176b57")+line(edge+inward,y+5,edge,y,"#176b57");
        }).join(""));
    }
    $("two-plot").innerHTML=svg;
  }
  // 3. Visualize sample spread separately from the null reference distribution.
  function drawData(result,pairs) {
    let svg="";
    if(result.kind==="paired") {
      const differences=pairs.filter(pair=>pair[0]!==null && pair[1]!==null).map(pair=>pair[0]-pair[1]);
      let low=differences.reduce((a,b)=>Math.min(a,b),0),high=differences.reduce((a,b)=>Math.max(a,b),0);
      const pad=Math.max(1,(high-low)*.15);low-=pad;high+=pad;
      const px=x=>70+(x-low)/(high-low)*860;
      svg=tag("title",{},"Individual paired differences, sample 1 minus sample 2")+line(px(0),30,px(0),200,"#8b98ab","4 4")+line(70,200,930,200,"#8b98ab");
      // Stack repeated differences; show up to 1000 marks to keep the chart responsive.
      const counts=new Map();
      differences.slice(0,1000).forEach(value=>{const key=Math.round(px(value)/9),count=counts.get(key)||0;counts.set(key,count+1);svg+=tag("circle",{cx:px(value),cy:180-count*8,r:3.5,fill:"#512888"});});
      const maxCount=Math.max(...counts.values(),1);
      if(maxCount>19) {
        svg=tag("title",{},"Individual paired differences, sample 1 minus sample 2")+line(px(0),30,px(0),200,"#8b98ab","4 4")+line(70,200,930,200,"#8b98ab");
        const stacks=new Map();
        differences.slice(0,1000).forEach(value=>{const key=Math.round(px(value)/9),count=stacks.get(key)||0;stacks.set(key,count+1);svg+=tag("circle",{cx:px(value),cy:190-count*155/maxCount,r:2.5,fill:"#512888"});});
      }
      for(let i=0;i<=4;i++){const value=low+(high-low)*i/4;svg+=text(px(value),225,Number(value.toFixed(2)));}
      svg+=text(500,263,"Difference (sample 1 − sample 2)");
      $("data-chart-title").textContent="Within-pair differences";
      $("data-chart-note").textContent=(result.omitted?result.omitted+" incomplete pair(s) excluded. ":"")+(differences.length>1000?"First 1,000 differences shown; all complete pairs included in the test.":"");
    } else {
      const rows=result.rows.slice(0,2),low=Math.min(...rows.map(row=>row.mean-3.5*row.sd)),high=Math.max(...rows.map(row=>row.mean+3.5*row.sd));
      const range=high-low||1,px=x=>70+(x-low)/range*860;
      const peak=Math.max(...rows.filter(row=>row.sd>0).map(row=>1/row.sd));
      svg=tag("title",{},"Illustrative normal curves with the sample means and SDs")+line(70,200,930,200,"#8b98ab");
      rows.forEach((row,j)=>{
        const color=j===0?"#512888":"#001641";
        if(row.sd>0) {
          let d="";
          for(let i=0;i<=500;i++){const x=low+range*i/500,y=200-Math.exp(-.5*((x-row.mean)/row.sd)**2)/row.sd/peak*145;d+=(i?" L ":"M ")+px(x)+" "+y;}
          svg+=tag("path",{d,fill:"none",stroke:color,"stroke-width":2.5,"stroke-dasharray":j?"7 4":""});
        } else svg+=line(px(row.mean),55,px(row.mean),200,color,j?"7 4":"");
        svg+=line(px(row.mean-row.sd),240+j*22,px(row.mean+row.sd),240+j*22,color);
      });
      for(let i=0;i<=4;i++){const value=low+range*i/4;svg+=text(px(value),223,Number(value.toFixed(2)));}
      svg+=text(70,25,"Sample 1: SD = "+fmt(rows[0].sd)+" (solid)","start")+text(930,25,"Sample 2: SD = "+fmt(rows[1].sd)+" (dashed)","end");
      $("data-chart-title").textContent="Comparing variability";
      $("data-chart-note").textContent="Illustrative normal curves, not observed distributions. Bars: mean ± 1 SD.";
    }
    $("data-plot").innerHTML=svg;
    $("data-chart-note").hidden=!$("data-chart-note").textContent;
  }
  function render() {
    const design=$("design").value;
    $("independent-options").hidden=design==="paired";
    $("method-independent").hidden=design==="paired";
    $("method-paired").hidden=design!=="paired";
    $("method-pooled").hidden=$("method").value!=="pooled";
    $("method-unpooled").hidden=$("method").value==="pooled";
    $("method-unequal").hidden=$("method").value!=="unequal";
    $("method-welch").hidden=$("method").value!=="welch";
    $("data-note").textContent=(design==="paired"?"One matched pair per row. ":"One sample per column; rows are not paired. ")+"Separate values with spaces, tabs, or commas. Use dots (.) for missing values"+(design==="independent"?" or a shorter column.":"; incomplete pairs are excluded.");
    try {
      const method=$("method").value,tail=document.querySelector('input[name="tail"]:checked').value,alpha=Number(document.querySelector('input[name="alpha"]:checked').value),level=Math.round(100*(1-alpha));
      const pairs=TTests.parse($("observations").value,2);
      const first=TTests.summarize(pairs.map(pair=>pair[0])),second=TTests.summarize(pairs.map(pair=>pair[1]));
      const result=design==="paired"?TTests.paired(pairs,level):TTests.independent(first,second,method,level);
      TTestView.render($("two-results"),result,tail,alpha);
      drawTest(result,tail,alpha);drawData(result,pairs);
      $("two-subtitle").textContent="H₀: difference = 0 · "+(design==="paired"?"Pairs = "+result.rows[0].n:"n₁ = "+first.n+" · n₂ = "+second.n)+" · DF = "+fmt(result.df);

      $("input-error").hidden=true;$("two-output").hidden=false;
    } catch(error) {
      $("input-error").textContent=error.message;$("input-error").hidden=false;$("two-output").hidden=true;
    }
  }
  document.querySelectorAll("input,select,textarea").forEach(input=>input.addEventListener("input",render));
  $("two-results").addEventListener("click",event=>{
    if(event.target.id!=="toggle-ci") return;
    showCI=!showCI;render();$("toggle-ci").focus();
  });
  $("reset-two").addEventListener("click",()=>{
    showCI=false;
    $("design").value="independent";$("method").value="pooled";
    document.querySelector('input[name="alpha"][value="0.05"]').checked=true;
    $("observations").value=fuel;document.querySelector('input[name="tail"][value="two"]').checked=true;render();
  });
  render();
})();
