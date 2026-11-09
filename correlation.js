"use strict";

// 1. Controls and shared display conventions; no model or remote service is used.
(() => {
  const $=id=>document.getElementById(id),example=$("observations").value,fmt=TTestView.number;
  const selected=name=>document.querySelector('input[name="'+name+'"]:checked').value;
  let showCI=false,fitInCorrelation=false,assistantContext={page:"correlation",valid:false};
  globalThis.readTeachingDemo=()=>assistantContext;
  const tag=(name,attrs,content="")=>"<"+name+" "+Object.entries(attrs).map(([key,value])=>key+'="'+value+'"').join(" ")+">"+content+"</"+name+">";
  const text=(x,y,value,anchor="middle")=>tag("text",{x,y,"text-anchor":anchor},value);
  const line=(x1,y1,x2,y2,color,dash="")=>tag("line",{x1,y1,x2,y2,stroke:color,"stroke-width":1.5,"stroke-dasharray":dash});
  const valueText=value=>Number.isFinite(value)?fmt(value):value===null?"—":value<0?"−∞":"∞";
  const tick=value=>Number(value.toPrecision(4)).toString();

  // 2. Observations on original X/Y axes. Regression fits Y on X with an intercept.
  function drawScatter(result,regression) {
    const showFit=regression||$("show-fit").checked;
    const ranges=[0,1].map(j=>{
      const low=result.points.reduce((value,pair)=>Math.min(value,pair[j]),Infinity);
      const high=result.points.reduce((value,pair)=>Math.max(value,pair[j]),-Infinity),pad=(high-low)*.08;
      if (!Number.isFinite(high-low+2*pad) || !(pad>0)) throw new Error("The plot exceeds the numerical range. Rescale the observations.");
      return [low-pad,high+pad];
    });
    const px=x=>80+(x-ranges[0][0])/(ranges[0][1]-ranges[0][0])*850;
    const py=y=>310-(y-ranges[1][0])/(ranges[1][1]-ranges[1][0])*260;
    let svg=tag("title",{},"Scatterplot of "+result.n+" complete X, Y pairs"+(showFit?" with the least-squares regression line":""));
    svg+='<defs><clipPath id="scatter-clip"><rect x="80" y="50" width="850" height="260"></rect></clipPath></defs>';
    for(let i=0;i<=4;i++) {
      const x=ranges[0][0]+(ranges[0][1]-ranges[0][0])*i/4,y=ranges[1][0]+(ranges[1][1]-ranges[1][0])*i/4;
      svg+=line(px(x),50,px(x),310,"#edf0f6")+line(80,py(y),930,py(y),"#edf0f6");
      svg+=text(px(x),337,tick(x))+text(68,py(y)+5,tick(y),"end");
    }
    if (ranges[0][0]<0&&ranges[0][1]>0) svg+=line(px(0),50,px(0),310,"#bcc5d2","4 5");
    if (ranges[1][0]<0&&ranges[1][1]>0) svg+=line(80,py(0),930,py(0),"#bcc5d2","4 5");
    let marks="";
    if (showFit) {
      const fitted=x=>result.y.mean+result.slope*(x-result.x.mean);
      marks+=tag("line",{class:"regression-line",x1:px(ranges[0][0]),y1:py(fitted(ranges[0][0])),x2:px(ranges[0][1]),y2:py(fitted(ranges[0][1])),stroke:"#001641","stroke-width":2.5});
    }
    result.points.slice(0,1000).forEach(([x,y])=>{marks+=tag("circle",{cx:px(x),cy:py(y),r:4.5,fill:"#512888","fill-opacity":.7},tag("title",{},"X = "+fmt(x)+", Y = "+fmt(y)));});
    svg+=tag("g",{"clip-path":"url(#scatter-clip)"},marks)+line(80,310,930,310,"#8b98ab")+line(80,50,80,310,"#8b98ab");
    svg+=text(505,377,regression?"X (predictor)":"X")+tag("text",{x:20,y:180,transform:"rotate(-90 20 180)","text-anchor":"middle"},regression?"Y (outcome)":"Y");
    $("scatter-plot").innerHTML=svg;
    $("scatter-subtitle").textContent="N = "+result.n+" · r = "+fmt(result.r)+(showFit?" · R² = "+fmt(result.rSquared):"");
    $("fit-summary").hidden=!showFit;
    $("fit-summary").textContent="ŷ = "+fmt(result.intercept)+(result.slope<0?" − ":" + ")+fmt(Math.abs(result.slope))+"x"+(regression?" · Residual SD = "+fmt(result.residualSD):"");
    const notes=[];
    if(result.omitted) notes.push(result.omitted+" incomplete pair(s) excluded.");
    if(result.n>1000) notes.push("First 1,000 points shown; all complete pairs included in the calculations.");
    $("observation-note").textContent=notes.join(" ");$("observation-note").hidden=!notes.length;
    $("descriptive-results").innerHTML='<table class="descriptive-table" aria-labelledby="descriptive-title"><thead><tr><th scope="col">Variable</th><th scope="col">N</th><th scope="col">Mean</th><th scope="col">SD</th></tr></thead><tbody>'
      +[result.x,result.y].map((row,i)=>'<tr><th scope="row">'+(i?"Y":"X")+'</th><td>'+row.n+'</td><td>'+fmt(row.mean)+'</td><td>'+fmt(row.sd)+'</td></tr>').join("")+'</tbody></table>';
  }

  // 3. Six results. Fisher SE is explicitly on the transformed z scale, not on r or t.
  function drawResults(result,regression,tail,alpha,standard,bounds) {
    const infer=!(regression&&result.perfect),statistic=regression?result.slopeT:result.t;
    const p=infer?(regression?result.slopeP:result.p)[tail]:null,reject=infer&&p<alpha;
    const critical=CorrelationStats.critical(result.n,tail,alpha);
    const cut=standard?critical.t:regression?critical.t*result.slopeSE:critical.r;
    const cutoffs=tail==="two"?[-cut,cut]:[tail==="left"?-cut:cut];
    $("estimate-label").textContent="Observed test statistic";
    $("estimate-value").textContent=standard?"t = "+valueText(statistic):regression?"b₁ = "+fmt(result.slope):"r = "+fmt(result.r);
    $("statistic-detail").textContent=(standard?(regression?"Slope = "+fmt(result.slope):"r = "+fmt(result.r)):"t = "+valueText(statistic))+" · DF = "+result.df;
    $("se-label").textContent=regression?"Standard error (slope)":"Standard error (Fisher z)";
    $("se-value").textContent=regression?fmt(result.slopeSE):valueText(result.fisherSE);
    $("se-detail").textContent=regression?"Y units per X unit":"";
    $("interval-label").textContent=Math.round(100*(1-alpha))+"% confidence interval";
    $("interval-value").textContent=bounds?TTestView.intervalText(bounds):"Not available";
    $("interval-detail").textContent=regression?"For the population slope":"For ρ · Fisher approximation";
    $("toggle-ci").disabled=!bounds;
    $("toggle-ci").textContent=showCI&&bounds?"Hide":"Show";
    $("toggle-ci").setAttribute("aria-pressed",String(showCI&&!!bounds));
    $("toggle-ci").setAttribute("aria-label",(showCI&&bounds?"Hide":"Show")+" confidence interval on the sampling distribution");
    $("critical-label").textContent=tail==="two"?"Critical values":"Critical value";
    $("critical-value").textContent=infer?cutoffs.map(fmt).join(", "):"—";
    $("critical-detail").textContent=standard?"t scale":regression?"Slope scale":"r scale";
    $("p-value").textContent=infer?TTestView.probability(p,alpha):"—";
    $("p-comparison").textContent=infer?(reject?"< ":p===alpha?"= ":"> ")+"α = "+alpha.toFixed(2):"";
    $("decision-box").classList.toggle("reject",reject);
    $("decision-value").textContent=infer?(reject?"Reject H₀":"Fail to reject H₀"):"Not available";
    $("decision-detail").textContent=infer?(reject?"Statistically significant":"Not statistically significant"):"";
    $("inference-note").textContent=regression&&result.perfect?"Perfect linear fit: residual variance is zero, so slope inference is not available.":!regression&&result.n===3?"The correlation test is available; Fisher’s confidence interval requires at least four complete pairs.":"";
    $("inference-note").hidden=!$("inference-note").textContent;
  }

  // 4. Exact null r density, or the corresponding t reference distribution.
  function drawSampling(result,regression,tail,alpha,standard,bounds) {
    const rScale=!regression&&!standard,critical=CorrelationStats.critical(result.n,tail,alpha);
    $("sampling-title").textContent=rScale?"Sampling distribution of r":!standard?"Student’s t on the slope scale":"Student’s t distribution";
    $("sampling-subtitle").textContent="H₀: "+(regression?"β₁ = 0":"ρ = 0")+" · N = "+result.n+" · DF = "+result.df;
    $("sampling-plot").setAttribute("aria-label",$("sampling-title").textContent+" under the null hypothesis, with the observed statistic and selected tail areas");
    if(regression&&result.perfect) {$("sampling-plot").innerHTML="";$("sampling-plot").hidden=true;$("sampling-note").hidden=true;return;}
    $("sampling-plot").hidden=false;
    const observed=rScale?result.r:regression?result.slopeT:result.t;
    const converted=bounds?.map(value=>rScale?value:regression?value/result.slopeSE:CorrelationStats.rToT(value,result.df));
    const extent=Math.max(4.4,critical.t*1.3,Number.isFinite(observed)?Math.abs(observed)*1.18:4.4,...(converted||[]).filter(Number.isFinite).map(value=>Math.abs(value)*1.12));
    // Preserve a legible curve for extreme t values; indicate clipped markers explicitly.
    const domain=rScale?1:Math.min(100,extent),base=270,cut=rScale?critical.r:critical.t;
    const clamp=value=>Math.max(-domain,Math.min(domain,value));
    const px=value=>65+(clamp(value)+domain)/(2*domain)*870;
    const density=value=>rScale?CorrelationStats.density(Math.max(-1+1e-8,Math.min(1-1e-8,value)),result.n):Stats.pdf(value,"t",result.df);
    const peak=rScale&&result.n===3?4*CorrelationStats.density(0,3):density(0);
    const py=value=>base-density(value)/peak*210;
    const axis=value=>!standard&&regression?value*result.slopeSE:value;
    function path(a,b,fill) {
      a=clamp(a);b=clamp(b);if(a>=b) return "";
      let d="M "+px(a)+" "+(fill?base:py(a));
      for(let i=0;i<=1000;i++) {const value=a+(b-a)*i/1000;d+=" L "+px(value)+" "+py(value);}
      return d+(fill?" L "+px(b)+" "+base+" Z":"");
    }
    const bands=tail==="two"?[[-domain,-cut],[cut,domain]]:tail==="left"?[[-domain,-cut]]:[[cut,domain]];
    const areas=tail==="two"?[[-domain,-Math.abs(observed)],[Math.abs(observed),domain]]:tail==="left"?[[-domain,observed]]:[[observed,domain]];
    let svg=tag("title",{},$("sampling-title").textContent+"; "+tail+"-tailed p-value "+(regression?result.slopeP:result.p)[tail]);
    svg+='<defs><clipPath id="sampling-clip"><rect x="65" y="45" width="870" height="225"></rect></clipPath></defs>';
    let curves="",strips="";
    bands.forEach(([a,b])=>{curves+=tag("path",{d:path(a,b,true),fill:"#efb8bc"});strips+=tag("rect",{x:px(a),y:base+4,width:Math.max(0,px(b)-px(a)),height:2,fill:"#c44248"});});
    areas.forEach(([a,b])=>{curves+=tag("path",{d:path(a,b,true),fill:"#9270b9","fill-opacity":.75});});
    curves+=tag("path",{d:path(-domain,domain,false),fill:"none",stroke:"#001641","stroke-width":2.5});
    svg+=tag("g",{"clip-path":"url(#sampling-clip)"},curves)+strips+line(65,base,935,base,"#8b98ab");
    svg+=line(px(0),45,px(0),base,"#bcc5d2","4 6");
    for(let i=-2;i<=2;i++) svg+=text(px(i*domain/2),302,tick(axis(i*domain/2)));
    const label=rScale?"Observed r = "+fmt(result.r):!standard?"Observed slope = "+fmt(result.slope):"Observed t = "+valueText(observed);
    svg+=line(px(observed),40,px(observed),base,"#001641","5 4")+text(Math.max(180,Math.min(820,px(observed))),25,label);
    svg+=tag("circle",{cx:px(observed),cy:base,r:6,fill:"#001641"});
    svg+=text(500,350,rScale?"Correlation coefficient (r)":!standard?"Slope (Y units per X unit)":"Standardized statistic (t)");
    if(showCI&&converted) {
      const y=base+17;
      const caps=converted.map(value=>{
        if(Number.isFinite(value)&&Math.abs(value)<=domain) return line(px(value),y-5,px(value),y+5,"#176b57");
        const edge=px(value),inward=value<0?7:-7;
        return line(edge+inward,y-5,edge,y,"#176b57")+line(edge+inward,y+5,edge,y,"#176b57");
      }).join("");
      svg+=tag("g",{class:"ci-overlay",role:"img","aria-label":Math.round(100*(1-alpha))+"% confidence interval for "+(regression?"the population slope":"rho")+": "+TTestView.intervalText(bounds)},line(px(converted[0]),y,px(converted[1]),y,"#176b57")+caps);
    }
    $("sampling-plot").innerHTML=svg;
    const notes=[];
    if(rScale&&result.n===3) notes.push("For N = 3, the density increases without bound near r = −1 and r = 1.");
    if(!rScale&&(extent>100||!Number.isFinite(observed)||showCI&&converted?.some(value=>Math.abs(value)>domain))) notes.push("Values beyond the displayed range are marked at the plot edge.");
    $("sampling-note").textContent=notes.join(" ");$("sampling-note").hidden=!notes.length;
  }

  // 5. Refresh all outputs together; invalid input cannot leave stale results visible.
  function render() {
    const regression=$("analysis").value==="regression",tail=selected("tail"),alpha=Number(selected("alpha")),standard=selected("scale")==="standard";
    $("method-correlation").hidden=regression;$("method-regression").hidden=!regression;
    $("original-scale-label").textContent=regression?"Slope (b₁)":"Correlation (r)";
    $("show-fit").disabled=regression;
    $("hypothesis").textContent="H₀: "+(regression?"β₁":"ρ")+" = 0 · H₁: "+(regression?"β₁":"ρ")+(tail==="two"?" ≠ 0":tail==="right"?" > 0":" < 0");
    try {
      const result=CorrelationStats.calculate(TTests.parse($("observations").value,2));
      const bounds=regression?CorrelationStats.slopeInterval(result,tail,alpha):CorrelationStats.correlationInterval(result,tail,alpha);
      drawScatter(result,regression);drawResults(result,regression,tail,alpha,standard,bounds);drawSampling(result,regression,tail,alpha,standard,bounds);
      $("input-error").hidden=true;$("correlation-output").hidden=false;
      const p=regression?result.slopeP?.[tail]??null:result.p[tail];
      assistantContext={page:"correlation",valid:true,method:regression?"regression":"correlation",n:result.n,df:result.df,tail,alpha,scale:standard?"standard":"original",
        r:result.r,slope:result.slope,intercept:result.intercept,rSquared:result.rSquared,slopeSE:result.slopeSE,fisherSE:result.fisherSE,residualSD:result.residualSD,
        statistic:regression?result.slopeT:result.t,p,confidenceInterval:bounds,omittedPairs:result.omitted,x:result.x,y:result.y,
        inferenceAvailable:p!==null,decision:p===null?null:p<alpha?"Reject H₀":"Fail to reject H₀"};
    } catch(error) {
      assistantContext={page:"correlation",valid:false};
      $("input-error").textContent=error.message;$("input-error").hidden=false;$("correlation-output").hidden=true;
    }
  }
  document.querySelectorAll("aside input,aside select,aside textarea").forEach(input=>input.addEventListener("input",()=>{
    if(input.id==="analysis") {
      if(input.value==="regression") {fitInCorrelation=$("show-fit").checked;$("show-fit").checked=true;}
      else $("show-fit").checked=fitInCorrelation;
    }
    render();
  }));
  $("toggle-ci").addEventListener("click",()=>{showCI=!showCI;render();});
  $("reset-correlation").addEventListener("click",()=>{
    showCI=false;fitInCorrelation=false;$("analysis").value="correlation";$("observations").value=example;$("show-fit").checked=false;
    document.querySelector('input[name="scale"][value="original"]').checked=true;
    document.querySelector('input[name="tail"][value="two"]').checked=true;
    document.querySelector('input[name="alpha"][value="0.05"]').checked=true;render();
  });
  render();
})();
