* 1. Run from validation/ with Stata 19; no external data are needed.
version 19
clear all
set more off
set linesize 255
capture log close
log using "correlation-stata-results.log", text replace
file open correlation_results using "correlation-stata.csv", write text replace
file write correlation_results "case,n,df,r,t,p,slope,intercept,slope_se,residual_sd,r_squared,ci_lower,ci_upper" _n

* 2. default; double input preserves the fixture precision.
clear
input double(x y)
1 3
2 5
3 4
4 7
5 5
6 8
7 6
8 10
9 8
10 11
11 9
12 12
end
quietly pwcorr x y, sig
scalar demo_r = r(rho)
matrix demo_significance = r(sig)
scalar demo_p = demo_significance[1,2]
quietly regress y x
matrix demo_table = r(table)
file write correlation_results "default"
file write correlation_results "," %24.17g (e(N))
file write correlation_results "," %24.17g (e(df_r))
file write correlation_results "," %24.17g (demo_r)
file write correlation_results "," %24.17g (_b[x]/_se[x])
file write correlation_results "," %24.17g (demo_p)
file write correlation_results "," %24.17g (_b[x])
file write correlation_results "," %24.17g (_b[_cons])
file write correlation_results "," %24.17g (_se[x])
file write correlation_results "," %24.17g (e(rmse))
file write correlation_results "," %24.17g (e(r2))
file write correlation_results "," %24.17g (demo_table[5,1])
file write correlation_results "," %24.17g (demo_table[6,1])
file write correlation_results _n

* 3. missing; double input preserves the fixture precision.
clear
input double(x y)
1 2
. 9
4 3
7 .
6 8
9 6
. .
end
quietly pwcorr x y, sig
scalar demo_r = r(rho)
matrix demo_significance = r(sig)
scalar demo_p = demo_significance[1,2]
quietly regress y x
matrix demo_table = r(table)
file write correlation_results "missing"
file write correlation_results "," %24.17g (e(N))
file write correlation_results "," %24.17g (e(df_r))
file write correlation_results "," %24.17g (demo_r)
file write correlation_results "," %24.17g (_b[x]/_se[x])
file write correlation_results "," %24.17g (demo_p)
file write correlation_results "," %24.17g (_b[x])
file write correlation_results "," %24.17g (_b[_cons])
file write correlation_results "," %24.17g (_se[x])
file write correlation_results "," %24.17g (e(rmse))
file write correlation_results "," %24.17g (e(r2))
file write correlation_results "," %24.17g (demo_table[5,1])
file write correlation_results "," %24.17g (demo_table[6,1])
file write correlation_results _n

* 4. zero; double input preserves the fixture precision.
clear
input double(x y)
-2 4
-1 1
0 0
1 1
2 4
end
quietly pwcorr x y, sig
scalar demo_r = r(rho)
matrix demo_significance = r(sig)
scalar demo_p = demo_significance[1,2]
quietly regress y x
matrix demo_table = r(table)
file write correlation_results "zero"
file write correlation_results "," %24.17g (e(N))
file write correlation_results "," %24.17g (e(df_r))
file write correlation_results "," %24.17g (demo_r)
file write correlation_results "," %24.17g (_b[x]/_se[x])
file write correlation_results "," %24.17g (demo_p)
file write correlation_results "," %24.17g (_b[x])
file write correlation_results "," %24.17g (_b[_cons])
file write correlation_results "," %24.17g (_se[x])
file write correlation_results "," %24.17g (e(rmse))
file write correlation_results "," %24.17g (e(r2))
file write correlation_results "," %24.17g (demo_table[5,1])
file write correlation_results "," %24.17g (demo_table[6,1])
file write correlation_results _n

* 5. three; double input preserves the fixture precision.
clear
input double(x y)
1 2
4 3
6 8
end
quietly pwcorr x y, sig
scalar demo_r = r(rho)
matrix demo_significance = r(sig)
scalar demo_p = demo_significance[1,2]
quietly regress y x
matrix demo_table = r(table)
file write correlation_results "three"
file write correlation_results "," %24.17g (e(N))
file write correlation_results "," %24.17g (e(df_r))
file write correlation_results "," %24.17g (demo_r)
file write correlation_results "," %24.17g (_b[x]/_se[x])
file write correlation_results "," %24.17g (demo_p)
file write correlation_results "," %24.17g (_b[x])
file write correlation_results "," %24.17g (_b[_cons])
file write correlation_results "," %24.17g (_se[x])
file write correlation_results "," %24.17g (e(rmse))
file write correlation_results "," %24.17g (e(r2))
file write correlation_results "," %24.17g (demo_table[5,1])
file write correlation_results "," %24.17g (demo_table[6,1])
file write correlation_results _n

* 6. n20-slope-2; double input preserves the fixture precision.
clear
input double(x y)
6.174781468137225 -9.100855980238045
7.34060588960957 -9.811853890837957
11.275773571326937 -25.67302717893579
8.144094151527455 -8.518671056664244
6.838392556222726 -9.612375822717956
7.691416019108607 -12.265151064894487
11.604721355921562 -23.7267006782984
8.175213543501691 -6.7271268934471005
12.426694473806123 -25.140487489418653
7.028320142405298 -9.697677558254522
8.66678712660384 -16.755602649588244
12.8605145447545 -21.988198867808904
12.736987462341702 -25.019572688249564
9.248934519473238 -12.383544165292376
9.827238468495056 -12.104327894389389
11.357114455855706 -14.800335527340245
9.394980386601688 -19.449502768610312
9.299642287435764 -19.910101077671765
9.147477556528548 -10.778000474319287
11.415376561065575 -17.983642387620165
end
quietly pwcorr x y, sig
scalar demo_r = r(rho)
matrix demo_significance = r(sig)
scalar demo_p = demo_significance[1,2]
quietly regress y x
matrix demo_table = r(table)
file write correlation_results "n20-slope-2"
file write correlation_results "," %24.17g (e(N))
file write correlation_results "," %24.17g (e(df_r))
file write correlation_results "," %24.17g (demo_r)
file write correlation_results "," %24.17g (_b[x]/_se[x])
file write correlation_results "," %24.17g (demo_p)
file write correlation_results "," %24.17g (_b[x])
file write correlation_results "," %24.17g (_b[_cons])
file write correlation_results "," %24.17g (_se[x])
file write correlation_results "," %24.17g (e(rmse))
file write correlation_results "," %24.17g (e(r2))
file write correlation_results "," %24.17g (demo_table[5,1])
file write correlation_results "," %24.17g (demo_table[6,1])
file write correlation_results _n

* 7. n100-slope3; double input preserves the fixture precision.
clear
input double(x y)
13.962451155153666 41.75684963064464
12.972503294551537 47.64162940021179
10.749790389614933 35.708967092382586
9.625085698427105 28.593191937039396
14.951951299225732 44.517496175042275
15.524678103938472 55.247348997474454
7.828493486217927 33.39614802613616
11.040505683730075 31.159080618233343
5.9920153786312325 26.402626652672787
11.455128930742193 39.7997524172498
9.799916958458368 31.782835777406376
15.6165734498413 49.35013106773655
9.929261894140492 30.338416141644284
2.7240828628935074 11.590406675292487
13.906515010306455 41.45980273358405
7.183533328856069 24.89531202720592
16.411179852154802 55.352327748243276
9.15081681427121 26.304591365486964
8.64558346820776 29.101192189351767
12.910356632721935 39.036701724192994
11.496549643600558 43.90765794667992
10.757484410652115 40.00021202105331
4.794420344530467 19.518365375646543
9.506543764247729 33.61758058029514
10.11199025650322 36.29546818683846
8.578547071975025 30.113221578496088
15.587927160297124 56.501105867003304
8.73238327253369 28.280877938579135
7.6829205952388 23.808281704044685
9.26490223022531 32.911261734476604
8.07103822782492 26.81236304562072
13.464716238862719 42.921960453836725
7.114661293946955 27.078746884986778
11.37258066783025 38.76151630138461
11.11570611816882 35.44888913981763
11.291136041914259 36.22947136280304
7.816712242237264 27.92455824700095
10.856931138163343 36.97583139753434
12.089207831177333 38.153888781368124
7.501560651127004 25.638647341925235
12.155746082986695 42.10255520759335
6.757795361422202 32.34402624371421
12.63345761215788 37.86569020874534
8.668322972936892 32.45523426558714
11.904619185425858 39.626967191977116
15.262677966562846 53.901644408363026
8.67595248024243 28.889615753156647
7.8344384501416995 29.424710564387404
6.265558351938948 23.357682488864054
13.582878942213366 50.23598234380484
14.491835275153761 52.95973338558317
10.337349078000488 33.82741517263564
12.883212553388155 44.92206947316002
12.428450593431783 42.03011419822476
7.9734408905508545 27.998942303996845
5.837411857832863 19.126198706233332
5.830577395420175 22.835904052929404
8.801167883405764 37.00945566786008
13.433897091953146 41.418967746330296
13.605622612119426 46.887297178686055
4.094986952943832 16.611435103912438
9.515941617029908 34.052979787917856
3.6459420164781724 16.309110220795827
5.152853622016878 25.19131370415323
10.88990076270043 40.77467083100428
11.032129504305622 43.84321972683151
11.694307224330169 37.39136190920063
14.243939015806959 44.47554943210498
11.931374316038632 41.19569743382875
10.56107767174762 36.01111373030306
8.219008259026353 31.52850099247527
11.56209674738231 42.62163076899333
12.061252246282233 39.45005979635396
9.012963741279211 33.25143208360377
10.226617594537991 37.006612501317086
9.407042700299971 34.852401437192526
7.422282530186709 23.10137400112809
9.119406068092188 37.36896103146381
10.958974142367321 34.42868594853205
13.161941415350602 45.05504006405299
12.98093017516591 46.958480971909665
6.104196004998503 24.054603456305784
8.184897438333964 27.678517214699283
12.21269558748572 43.13386219445639
12.151357855042084 38.51080355941578
10.803913771243444 36.06298513489505
9.641327390972313 39.195173447474374
8.726432270652822 36.99568264675135
8.935883520415796 32.351248084890216
9.773760556300763 30.305735313603197
12.694252944085049 39.908283266334365
11.343803561731729 39.3327196081315
8.15415028194282 28.100859864297195
7.3123256148127735 29.645274660714264
14.66776824413895 48.31691005868196
8.401094213830328 32.15170111121606
11.518949090527 37.271565304295265
6.879340542016294 30.530114980713194
10.339125134709388 38.94320680907579
11.544474050736508 39.53903317031938
end
quietly pwcorr x y, sig
scalar demo_r = r(rho)
matrix demo_significance = r(sig)
scalar demo_p = demo_significance[1,2]
quietly regress y x
matrix demo_table = r(table)
file write correlation_results "n100-slope3"
file write correlation_results "," %24.17g (e(N))
file write correlation_results "," %24.17g (e(df_r))
file write correlation_results "," %24.17g (demo_r)
file write correlation_results "," %24.17g (_b[x]/_se[x])
file write correlation_results "," %24.17g (demo_p)
file write correlation_results "," %24.17g (_b[x])
file write correlation_results "," %24.17g (_b[_cons])
file write correlation_results "," %24.17g (_se[x])
file write correlation_results "," %24.17g (e(rmse))
file write correlation_results "," %24.17g (e(r2))
file write correlation_results "," %24.17g (demo_table[5,1])
file write correlation_results "," %24.17g (demo_table[6,1])
file write correlation_results _n

file close correlation_results
log close
exit, clear
