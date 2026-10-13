"use strict";

// 1. Stata 19 ttest calculations. Keep full precision until display.
const TTests = (() => {
  const probability = typeof module!=="undefined" ? require("./app.js") : null;
  const stats = () => probability || Stats;
  function validate(sample) {
    if (!Number.isInteger(sample.n) || sample.n<2 || !Number.isFinite(sample.mean) || !Number.isFinite(sample.sd) || sample.sd<0)
      throw new Error("Enter at least two observations, a finite mean, and a nonnegative sample SD for each sample.");
  }
  function interval(mean,se,df,level) {
    const margin=stats().quantile(.5+level/200,"t",df)*se;
    return [mean-margin,mean+margin];
  }
  function row(sample,label,level) {
    validate(sample);
    const se=sample.sd/Math.sqrt(sample.n);
    return {...sample,label,se,ci:interval(sample.mean,se,sample.n-1,level)};
  }
  function finish(result,level) {
    if (!Number.isFinite(level) || level<10 || level>99.99) throw new Error("Confidence level must be between 10 and 99.99 percent.");
    if (!(result.se>0) || !Number.isFinite(result.se)) throw new Error("The standard error must be positive to calculate a t-test.");
    result.level=level;
    result.t=(result.estimate-result.nullMean)/result.se;
    result.p={left:stats().pValue(result.t,"left","t",result.df),two:stats().pValue(result.t,"two","t",result.df),right:stats().pValue(result.t,"right","t",result.df)};
    result.ci=interval(result.estimate,result.se,result.df,level);
    return result;
  }
  function one(sample,nullMean=0,level=95) {
    const first=row(sample,"x",level);
    if (!Number.isFinite(nullMean)) throw new Error("Enter a finite hypothesized mean.");
    return finish({kind:"one",method:"one",title:"One-sample t test",rows:[first],estimate:sample.mean,nullMean,se:first.se,df:sample.n-1},level);
  }
  function independent(first,second,method="pooled",level=95) {
    validate(first);validate(second);
    if (!["pooled","unequal","welch"].includes(method)) throw new Error("Choose an independent samples method.");
    const a=first.sd**2/first.n,b=second.sd**2/second.n;
    const pooled=((first.n-1)*first.sd**2+(second.n-1)*second.sd**2)/(first.n+second.n-2);
    let se=Math.sqrt(pooled*(1/first.n+1/second.n)),df=first.n+second.n-2;
    if (method!=="pooled") {
      se=Math.sqrt(a+b);
      // Stata's welch option uses Welch (1947), distinct from unequal/Satterthwaite.
      df=method==="welch" ? -2+(a+b)**2/(a*a/(first.n+1)+b*b/(second.n+1))
        : (a+b)**2/(a*a/(first.n-1)+b*b/(second.n-1));
    }
    const n=first.n+second.n,mean=(first.n*first.mean+second.n*second.mean)/n;
    // Combined SD includes between-group variation; it is not the pooled SD.
    const sd=Math.sqrt(((first.n-1)*first.sd**2+(second.n-1)*second.sd**2+(first.mean-second.mean)**2*first.n*second.n/n)/(n-1));
    const result=finish({kind:"independent",method,title:"Two-sample t test with "+(method==="pooled"?"equal":"unequal")+" variances",rows:[row(first,"x",level),row(second,"y",level),row({n,mean,sd},"Combined",level)],estimate:first.mean-second.mean,nullMean:0,se,df,pooledSD:Math.sqrt(pooled)},level);
    result.rows.push({label:"diff",n:null,mean:result.estimate,se,sd:null,ci:result.ci});
    return result;
  }
  function summarize(values) {
    const clean=values.filter(x=>x!==null);
    if (clean.some(x=>!Number.isFinite(x))) throw new Error("Enter finite numeric observations.");
    if (clean.length<2) throw new Error("At least two nonmissing observations are needed in each sample.");
    const n=clean.length,mean=clean.reduce((sum,x)=>sum+x,0)/n;
    const sd=Math.sqrt(clean.reduce((sum,x)=>sum+(x-mean)**2,0)/(n-1));
    return {n,mean,sd};
  }
  function paired(pairs,level=95) {
    const complete=pairs.filter(pair=>pair[0]!==null && pair[1]!==null);
    const first=summarize(complete.map(pair=>pair[0])),second=summarize(complete.map(pair=>pair[1]));
    const difference=summarize(complete.map(pair=>pair[0]-pair[1]));
    const diff=row(difference,"diff",level);
    return finish({kind:"paired",method:"paired",title:"Paired t test",rows:[row(first,"x",level),row(second,"y",level),diff],estimate:difference.mean,nullMean:0,se:diff.se,df:difference.n-1,omitted:pairs.length-complete.length},level);
  }
  // 2. Data entry. A dot represents a missing observation, preserving pair alignment.
  function parse(text,columns=1) {
    const lines=text.trim().split(/\r?\n/).filter(line=>line.trim());
    if (!text.trim()) throw new Error("Enter observations first.");
    return lines.map((line,i)=>{
      if (/(^,|,\s*,|,$)/.test(line.trim())) throw new Error("Row "+(i+1)+": use a dot for a missing value.");
      const cells=line.trim().split(/[\s,]+/);
      if (cells.length!==columns) throw new Error("Row "+(i+1)+": enter "+columns+" value"+(columns===1?"":"s")+"; use a dot for a missing value.");
      return cells.map(cell=>{
        if (/^\.[a-z]?$/.test(cell)) return null;
        if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(cell) || !Number.isFinite(Number(cell))) throw new Error("Row "+(i+1)+": use numeric values or a dot for missing data.");
        return Number(cell);
      });
    });
  }
  return {one,independent,paired,summarize,parse};
})();
if (typeof module!=="undefined") module.exports=TTests;
