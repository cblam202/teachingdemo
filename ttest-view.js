"use strict";

// 1. Shared formatting and a compact results layout matching the z-test.
const TTestView = (() => {
  function number(value) {
    if (value===null || value===undefined) return "";
    if (!Number.isFinite(value)) return "—";
    return Number(value.toPrecision(7)).toString();
  }
  function probability(p,alpha) {
    if (p>0 && p<.0001) return p.toExponential(2);
    let digits=4;
    // Keep the displayed comparison readable when rounding would make p appear equal to alpha.
    while (digits<15 && p!==alpha && Number(p.toFixed(digits))===alpha) digits++;
    return p.toFixed(digits);
  }
  // 2. Display intervals follow the test direction; the Stata calculation API retains its two-sided intervals.
  function interval(estimate,se,kind,df,tail,alpha) {
    const margin=Stats.quantile(1-alpha/(tail==="two"?2:1),kind,df)*se;
    return [tail==="left"?-Infinity:estimate-margin,tail==="right"?Infinity:estimate+margin];
  }
  function intervalText(bounds) {
    const bound=value=>Number.isFinite(value)?number(value):value<0?"−∞":"∞";
    return (bounds[0]===-Infinity?"(":"[")+bound(bounds[0])+", "+bound(bounds[1])+(bounds[1]===Infinity?")":"]");
  }
  function render(target,result,tail="two",alpha=.05) {
    const critical=Stats.quantile(1-alpha/(tail==="two"?2:1),"t",result.df);
    const cutoffs=tail==="two"?[-critical,critical]:[tail==="left"?-critical:critical];
    const p=result.p[tail],reject=p<alpha;
    const displayedP=probability(p,alpha);
    target.innerHTML="<div class='results results-grid'><div><span class='result-label'>Observed test statistic</span><strong>t = "+result.t.toFixed(3)+"</strong><small>Mean difference: "+number(result.estimate)+"</small></div>"
      +"<div><span class='result-label'>Standard error</span><strong>"+number(result.se)+"</strong></div>"
      +"<div><div class='interval-heading'><span class='result-label' title='"+(tail==="two"?"Two-sided":"One-sided")+" confidence interval for the population mean difference'>"+Math.round(100*(1-alpha))+"% confidence interval</span><button id='toggle-ci' class='quiet ci-toggle' type='button' aria-pressed='false' aria-controls='two-plot' aria-label='Show confidence interval on the plot'>Show</button></div><strong>"+intervalText(interval(result.estimate,result.se,"t",result.df,tail,alpha))+"</strong></div>"
      +"<div><span class='result-label'>"+(cutoffs.length===1?"Critical value":"Critical values")+"</span><strong>"+cutoffs.map(x=>x.toFixed(3)).join(", ")+"</strong><small>t scale</small></div>"
      +"<div><span class='result-label'>p-value</span><strong>"+displayedP+"</strong><small>"+(reject?"&lt; ":p===alpha?"= ":"&gt; ")+"α = "+alpha.toFixed(2)+"</small></div>"
      +"<div class='"+(reject?"reject":"")+"'><span class='result-label'>Decision</span><strong>"+(reject?"Reject H₀":"Fail to reject H₀")+"</strong><small>"+(reject?"Statistically significant":"Not statistically significant")+"</small></div></div>";
  }
  return {render,number,probability,interval,intervalText};
})();
