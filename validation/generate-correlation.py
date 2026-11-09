"""Independent SciPy fixtures for Pearson correlation and simple OLS regression."""
from pathlib import Path
import json
import math
import numpy as np
import scipy
from scipy import stats

# 1. Fixed teaching cases and seeded datasets with different sizes and associations.
rng = np.random.default_rng(91312)
datasets = [
    ("default", [[x, y] for x, y in zip(range(1, 13), [3, 5, 4, 7, 5, 8, 6, 10, 8, 11, 9, 12])]),
    ("missing", [[1, 2], [None, 9], [4, 3], [7, None], [6, 8], [9, 6], [None, None]]),
    ("zero", [[-2, 4], [-1, 1], [0, 0], [1, 1], [2, 4]]),
    ("three", [[1, 2], [4, 3], [6, 8]]),
    ("perfect-positive", [[1, 5], [2, 7], [3, 9], [4, 11]]),
    ("perfect-negative", [[1, 3], [2, 1], [3, -1], [4, -3]]),
]
for n in [4, 5, 8, 20, 100, 1000]:
    for slope in [-2, 0, .4, 3]:
        x = rng.normal(10, 3, n)
        y = 5 + slope * x + rng.normal(0, 4, n)
        datasets.append((f"n{n}-slope{slope}", np.column_stack((x, y)).tolist()))
# Keep SciPy 1.13 linregress's internal variance product in its floating-point range.
# More extreme unit changes are tested separately using scale invariance.
datasets.append(("small-units", [[x * 1e-50, y * 1e-50] for x, y in datasets[0][1]]))
datasets.append(("large-units", [[x * 1e50, y * 1e50] for x, y in datasets[0][1]]))

# 2. Reference quantities use SciPy's beta-based Pearson test and linregress independently.
records = []
for name, pairs in datasets:
    complete = [(x, y) for x, y in pairs if x is not None and y is not None]
    x, y = np.array(complete).T
    n = len(x)
    fit = stats.linregress(x, y)
    residual = y - (fit.intercept + fit.slope * x)
    record = dict(name=name, pairs=pairs, n=n, omitted=len(pairs)-n, r=float(stats.pearsonr(x, y).statistic),
                  slope=float(fit.slope), intercept=float(fit.intercept), slopeSE=float(fit.stderr),
                  residualSD=float(np.sqrt(np.sum(residual**2)/(n-2))),
                  x=dict(mean=float(x.mean()), sd=float(x.std(ddof=1))),
                  y=dict(mean=float(y.mean()), sd=float(y.std(ddof=1))), settings=[])
    for tail, alternative in [("two", "two-sided"), ("left", "less"), ("right", "greater")]:
        pearson = stats.pearsonr(x, y, alternative=alternative)
        for alpha in [.1, .05, .01]:
            critical_t = stats.t.ppf(1-alpha/(2 if tail == "two" else 1), n-2)
            # Independently invert the exact beta distribution, rather than converting t.
            critical_r = stats.beta.ppf(1-alpha/(2 if tail == "two" else 1), n/2-1, n/2-1, loc=-1, scale=2)
            ci = pearson.confidence_interval(1-alpha)
            margin = critical_t * fit.stderr
            record["settings"].append(dict(tail=tail, alpha=alpha, p=float(pearson.pvalue), criticalT=float(critical_t),
                criticalR=float(critical_r), ci=None if n<=3 else [float(ci.low),float(ci.high)],
                slopeCI=None if name.startswith("perfect") else ["-Infinity" if tail=="left" else float(fit.slope-margin), "Infinity" if tail=="right" else float(fit.slope+margin)]))
    records.append(record)

# 3. Density values independently computed by SciPy, including the U-shaped N = 3 case.
densities = [dict(n=n, r=r, density=float(stats.beta.pdf(r, n/2-1, n/2-1, loc=-1, scale=2)))
             for n in [3,4,5,12,100,1000] for r in [-.99,-.9,-.4,0,.2,.8,.99]]
path = Path(__file__).with_name("correlation-reference.json")
path.write_text(json.dumps(dict(source="SciPy "+scipy.__version__, seed=91312, cases=records, densities=densities), indent=2, allow_nan=False)+"\n")
print(f"Wrote {len(records)} datasets, {sum(len(r['settings']) for r in records)} inference settings, and {len(densities)} densities to {path.name}.")
