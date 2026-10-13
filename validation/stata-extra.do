clear all
set more off
log using "validation/stata-extra.log", text replace
* 1. Confidence levels and unequal sample sizes.
ttesti 8 3.2 .1 17 3.4 .15, unequal level(90)
return list
ttesti 8 3.2 .1 17 3.4 .15, welch level(99)
return list
* 2. Missing observations and pairwise deletion.
input double(x y)
1 2
. 9
4 3
7 .
6 8
end
ttest x == y
return list
ttest x == y, unpaired
return list
* 3. Zero sample variance.
ttesti 8 5 0 9 3 2, unequal
return list
capture noisily ttesti 8 5 0 3
log close
