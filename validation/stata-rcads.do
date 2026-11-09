clear all
set more off
capture log close
log using "validation/stata-rcads.log", text replace
* 1. Full precision course data, read only.
* Set global RCADS_SOURCE to the local workbook path before running this file.
if "$RCADS_SOURCE" == "" {
    display as error "Set global RCADS_SOURCE to the local RCADS workbook path first."
    exit 198
}
import excel "$RCADS_SOURCE", cellrange(B2:C137) firstrow clear
ttest September == December
return list
* 2. Verify the known-population-SD z-test command and returned values.
ztesti 25 107 15 100
return list
log close
