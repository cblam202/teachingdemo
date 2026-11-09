"use strict";

// 1. Pearson correlation and ordinary least-squares regression with an intercept.
const CorrelationStats = (() => {
  const probability=typeof module!=="undefined"?require("./app.js"):null;
  const stats=()=>probability||Stats;
  function sum(values) {
    let total=0,correction=0;
    for(const value of values) {const adjusted=value-correction,next=total+adjusted;correction=(next-total)-adjusted;total=next;}
    return total;
  }
  function centered(values) {
    // Center before multiplying; scale deviations to avoid overflow in sums of squares.
    const n=values.length,origin=values[0],mean=origin+sum(values.map(value=>(value-origin)/n));
    const deviations=values.map(value=>value-mean),scale=deviations.reduce((largest,value)=>Math.max(largest,Math.abs(value)),0);
    if (!Number.isFinite(mean) || !Number.isFinite(scale)) throw new Error("These values exceed the numerical range. Rescale the observations.");
    if (scale===0) throw new Error("Both X and Y must vary. A constant variable has no defined correlation.");
    const unit=deviations.map(value=>value/scale),ss=sum(unit.map(value=>value*value));
    return {n,mean,sd:scale*Math.sqrt(ss/(n-1)),scale,unit,ss};
  }
  function rToT(r,df) {
    if (r<=-1) return -Infinity;
    if (r>=1) return Infinity;
    return r*Math.sqrt(df)/Math.sqrt((1-r)*(1+r));
  }
  function tToR(t,df) {
    if (!Number.isFinite(t)) return Math.sign(t);
    return t/Math.hypot(t,Math.sqrt(df));
  }
  function probabilities(t,df) {
    return Object.fromEntries(["two","left","right"].map(tail=>[tail,stats().pValue(t,tail,"t",df)]));
  }
  function calculate(pairs) {
    if (!Array.isArray(pairs) || pairs.some(pair=>!Array.isArray(pair)||pair.length!==2||pair.some(value=>value!==null&&!Number.isFinite(value))))
      throw new Error("Enter two numeric columns, X and Y; use dots for missing values.");
    const complete=pairs.filter(pair=>pair[0]!==null&&pair[1]!==null),n=complete.length,df=n-2;
    if (n<3) throw new Error("Enter at least three complete X, Y pairs.");
    const x=centered(complete.map(pair=>pair[0])),y=centered(complete.map(pair=>pair[1]));
    const cross=sum(x.unit.map((value,i)=>value*y.unit[i])),unitSlope=cross/x.ss;
    const residualSS=sum(x.unit.map((value,i)=>(y.unit[i]-unitSlope*value)**2));
    // Treat roundoff-sized residuals of an exact straight line as a perfect fit.
    const perfect=residualSS<=64*Number.EPSILON**2*y.ss;
    const r=perfect?Math.sign(cross):Math.max(-1,Math.min(1,cross/Math.sqrt(x.ss)/Math.sqrt(y.ss)));
    const slope=y.scale/x.scale*unitSlope,intercept=y.mean-slope*x.mean;
    const residualSD=perfect?0:y.scale*Math.sqrt(residualSS/df);
    const slopeSE=perfect?0:(y.scale/x.scale)*Math.sqrt(residualSS/df/x.ss);
    if (![x.sd,y.sd,slope,intercept,residualSD,slopeSE].every(Number.isFinite) || !perfect&&slopeSE===0)
      throw new Error("These values exceed the numerical range. Rescale the observations.");
    const t=rToT(r,df),slopeT=perfect?null:slope/slopeSE;
    if (!perfect&&!Number.isFinite(slopeT)) throw new Error("The slope test exceeds the numerical range. Rescale the observations.");
    return {n,df,omitted:pairs.length-n,r,rSquared:r*r,t,p:probabilities(t,df),fisherSE:n>3?1/Math.sqrt(n-3):null,
      x:{n,mean:x.mean,sd:x.sd},y:{n,mean:y.mean,sd:y.sd},slope,intercept,residualSD,slopeSE,slopeT,
      slopeP:perfect?null:probabilities(slopeT,df),perfect,points:complete};
  }
  // 2. Correlation inference: exact null distribution under bivariate normality, rho = 0.
  function density(r,n) {
    if (Math.abs(r)>1) return 0;
    if (Math.abs(r)===1) return n===3?Infinity:n===4?.5:0;
    const logConstant=Math.log(stats().pdf(0,"t",n-2))+.5*Math.log(n-2);
    return Math.exp(logConstant+(n-4)/2*Math.log((1-r)*(1+r)));
  }
  function critical(n,tail,alpha) {
    const t=stats().quantile(1-alpha/(tail==="two"?2:1),"t",n-2);
    return {t,r:tToR(t,n-2)};
  }
  // Fisher intervals are approximate and need n > 3; never substitute a t margin on r.
  function correlationInterval(result,tail,alpha) {
    if (result.fisherSE===null) return null;
    const z=Math.atanh(result.r),margin=stats().quantile(1-alpha/(tail==="two"?2:1))*result.fisherSE;
    return [tail==="left"?-1:Math.tanh(z-margin),tail==="right"?1:Math.tanh(z+margin)];
  }
  function slopeInterval(result,tail,alpha) {
    if (result.perfect) return null;
    const margin=stats().quantile(1-alpha/(tail==="two"?2:1),"t",result.df)*result.slopeSE;
    return [tail==="left"?-Infinity:result.slope-margin,tail==="right"?Infinity:result.slope+margin];
  }
  return {calculate,rToT,tToR,density,critical,correlationInterval,slopeInterval};
})();
if (typeof module!=="undefined") module.exports=CorrelationStats;
