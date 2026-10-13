"""Generate independent SciPy references and reproducible Stata cases; run from repository root."""
import json, random
from pathlib import Path
from scipy import stats
out=Path('validation')
refs=[]
for kind,df in [('z',24)]+[('t',v) for v in [1,2,3,7,24,134,1.25,17.8,1000,10000,1000000]]:
 dist=stats.norm if kind=='z' else stats.t(df)
 for x in [-40,-12,-8,-4,-1,-.00001,0,.00001,1,4,8,12,40]:
  refs.append(dict(op='cdf',kind=kind,df=df,x=x,value=float(dist.cdf(x))))
  refs.append(dict(op='pdf',kind=kind,df=df,x=x,value=float(dist.pdf(x))))
 for p in [1e-12,1e-8,.0001,.005,.01,.025,.05,.1,.5,.9,.95,.975,.99,.995,1-1e-8,1-1e-12]:
  refs.append(dict(op='quantile',kind=kind,df=df,x=p,value=float(dist.ppf(p))))
(out/'scipy-audit.json').write_text(json.dumps(refs,indent=2)+'\n')
rng=random.Random(913)
cases=[]
for i in range(40):
 first=dict(n=rng.choice([2,3,5,25,135,1000]),mean=rng.uniform(-80,80),sd=10**rng.uniform(-2,2))
 second=dict(n=rng.choice([2,4,17,65,300]),mean=rng.uniform(-80,80),sd=10**rng.uniform(-2,2))
 for method in ['z','one','pooled','unequal','welch']:
  cases.append(dict(first=first,second=second,method=method,level=rng.choice([90,95,99]),nullMean=rng.uniform(-30,30)))
(out/'audit-cases.json').write_text(json.dumps(cases,indent=2)+'\n')
lines=['clear all','set more off','capture log close','log using "validation/stata-audit.log", text replace','file open audit using "validation/stata-audit.csv", write replace','file write audit "id,t,df,se,p,left,right,lower,upper,oneLower,oneUpper" _n']
for i,c in enumerate(cases):
 a=c['first'];b=c['second'];cmd=f"quietly {'ztesti' if c['method']=='z' else 'ttesti'} {a['n']} {a['mean']:.17g} {a['sd']:.17g} "
 cmd+=f"{c['nullMean']:.17g}" if c['method'] in ['one','z'] else f"{b['n']} {b['mean']:.17g} {b['sd']:.17g}"
 cmd+=f", level({c['level']})"+(' '+c['method'] if c['method'] in ['unequal','welch'] else '')
 stat='r(z)' if c['method']=='z' else 'r(t)'
 df='0' if c['method']=='z' else 'r(df_t)'
 mean='r(mu)' if c['method']=='z' else 'r(mu_1)' if c['method']=='one' else 'r(mu_1)-r(mu_2)'
 lo='r(lb)' if c['method']=='z' else 'r(lb_1)' if c['method']=='one' else 'r(lb_diff)'
 hi='r(ub)' if c['method']=='z' else 'r(ub_1)' if c['method']=='one' else 'r(ub_diff)'
 q=f"invnormal({c['level']/100})" if c['method']=='z' else f"invttail(r(df_t),{1-c['level']/100:.17g})"
 lines += [cmd, f'file write audit "{i}," %24.17g ({stat}) "," %24.17g ({df}) "," %24.17g (r(se)) "," %24.17g (r(p)) "," %24.17g (r(p_l)) "," %24.17g (r(p_u)) "," %24.17g ({lo}) "," %24.17g ({hi}) "," %24.17g ({mean}-r(se)*{q}) "," %24.17g ({mean}+r(se)*{q}) _n']
lines += ['file close audit','log close']
(out/'stata-audit.do').write_text('\n'.join(lines)+'\n')
print(f'Generated {len(refs)} SciPy reference values and {len(cases)} Stata cases.')
