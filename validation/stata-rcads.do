clear all
set more off
capture log close
log using "validation/stata-rcads.log", text replace
* 1. Full precision course data, read only.
import excel "/Users/cblam/Library/CloudStorage/OneDrive-KansasStateUniversity/COE Teaching/EDCI 913 Inquiry I/3-Fall 2026/Stata/Groupwork data/Group work 3 - p7 RCADS.xlsx", cellrange(B2:C137) firstrow clear
ttest September == December
return list
* 2. Verify the known-population-SD z-test command and returned values.
ztesti 25 107 15 100
return list
log close
