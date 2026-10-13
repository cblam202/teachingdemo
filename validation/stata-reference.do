clear all
set more off
capture log close
log using "validation/stata-reference.log", text replace
* 1. Reference tests from the Stata 19 manual.
ttesti 24 62.6 15.8 75
return list
ttesti 20 20 5 32 15 4
return list
ttesti 20 20 5 32 15 4, unequal
return list
ttesti 20 20 5 32 15 4, welch
return list
* 2. Paired fuel example.
input double(x y)
20 24
23 25
21 21
25 22
18 23
17 18
18 17
24 28
20 24
24 27
23 21
19 23
end
ttest x == y
return list
ttest x == y, unpaired welch
return list
log close
