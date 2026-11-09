# Hypothesis testing demo

Open index.html in a browser and choose One-sample tests, Two-sample tests, or Correlation and regression.
Keep all HTML, JavaScript, and CSS files in the same folder.
The statistical demos need no installation, server, internet connection, or account.
The AI assistant is inactive while its engine replacement is pending.

## One-sample controls

- Fractional inputs keep full precision; native arrows step by 1 from the entered value. Sample size remains an integer.
- Enter sample size, mean under H₀, standard deviation, and the observed sample mean in original units. These inputs stay visible in both views.
- Normal (z) is selected on initial load and Reset. Choose normal (z) or Student's t. For z, use the known population SD; for t, use the sample SD.
- SE is calculated as SD / √n. Degrees of freedom are calculated as n − 1 for a one-sample t-test.
- Choose standardized or original scale to view the same test. The observed input always uses original units.
- The calculated p-value is preserved; the slider displays the nearest 0.01. Moving the slider updates the observed-value box.
- Choose two-tailed, right-tailed, or left-tailed.
- Choose α = 0.10, 0.05, or 0.01.
- Slide p in increments of 0.01 or drag the navy statistic marker. Dragging also snaps p to 0.01.
- To change sides, enter an observed value on the other side of the null mean or drag across the center.

Red indicates rejection regions. Purple indicates p-value areas.
The red strip under the axis keeps rejection regions visible when purple overlaps.

Changing distribution or test direction holds the observed value fixed and recalculates p.
Changing n, mean under H₀, or SD holds the original observed value fixed and recalculates the standardized statistic and p in either view.
Changing n alone does not alter the standardized normal curve.
Changing scale transforms axis labels and reported values.
Changing α holds p fixed.

## Two-sample controls

- Choose Independent (unpaired) or Dependent (paired).
- Choose Standardized or Original scale for the test chart. Original units equal t × estimated SE, centered at the null difference of zero. Shading and optional CIs follow the selected scale; numerical results stay unchanged. Reset restores Standardized.
- Paste two columns of observations for either design. Sample sizes, means, and SDs are calculated automatically. For independent samples with different sizes, pad the shorter column with dots.
- Choose equal variances (Stata default), unequal (Satterthwaite), or welch (Welch 1947).
- Paired tests require two columns of matched observations, one pair per row. They use the SD of the differences, not a pooled SD.
- Use a dot for missing data. Paired tests drop incomplete pairs from both summaries and the test. Independent tests omit missing observations separately in each column.
- Differences are always x minus y. Tail buttons select one p-value to display, rather than displaying all three together.
- Descriptive statistics above the lower chart show N, mean, and SD in original units. Paired summaries use complete pairs and include the mean and SD of within-pair differences. Independent summaries omit missing observations per sample and report the mean difference; difference-row N and SD are not applicable.
- The lower chart illustrates sample variability. Independent sample curves are normal illustrations based on the summaries, not evidence of normality. Paired data show individual differences.

## Correlation and regression

The Week 12 page, `correlation.html`, accepts two columns, X and Y, with one observation per row. Choose Pearson correlation (the default) or simple linear regression of Y on X. Both analyses use complete rows only; descriptive statistics and the scatterplot use the same observations as the calculation. Reset restores a constructed 12-pair teaching example, two tails, alpha .05, the original scale, and a hidden confidence interval.

The scatterplot appears first, followed by the six-result panel, descriptive statistics, and the null sampling distribution. A regression line is optional in correlation mode and always shown in regression mode, with the fitted equation and R-squared. Scatterplots show up to 1,000 points while calculations use every complete pair; larger inputs receive a notice.

For correlation, the original scale displays the exact null distribution of r on [-1, 1], assuming independent observations from a bivariate normal population with rho = 0. The standardized scale displays t = r sqrt(n - 2) / sqrt(1 - r²), with n - 2 degrees of freedom. This is a nonlinear transformation; its density is transformed as well. Rejection regions and p-value shading follow the selected tail and alpha. The r chart retains the full [-1, 1] range when the optional CI is shown.

Correlation confidence intervals use the Fisher transformation and are labeled as approximate. The reported standard error is explicitly SE(Fisher z) = 1 / sqrt(n - 3), not an SE on the r or t scale. The interval stays in correlation units in the results; its bounds are transformed for the standardized chart. One-sided intervals end at -1 or 1. Fisher intervals and exact t-based tests can disagree near significance cutoffs. With three complete pairs, the exact test remains available but the Fisher SE and interval are unavailable. With three pairs the r density has unbounded endpoints, which are clipped to the chart frame and identified in a conditional note.

Regression uses an intercept and conventional OLS slope standard errors. Its CI estimates the population slope. The original-scale reference chart multiplies t coordinates by the observed slope SE, as in the two-sample demo; it is not presented as the exact unstandardized sampling distribution of slopes. Both plot modes reserve space for finite CI bounds before Show is pressed. The t display is capped at ±100 for extreme cases, with an explicit notice and edge markers for out-of-range values.

At least three complete pairs and variation in both variables are required. For perfect correlation, the correlation p-values use their limiting values. A numerically perfect regression fit has zero residual variance, so slope inference and its reference plot are unavailable; the fitted line and descriptive results remain. Nonfinite observations, malformed rows, and values exceeding the numerical range produce an input error and hide previous results.

All four pages load only local statistical and typesetting assets. The inactive chatbot is disconnected while its engine replacement is pending; its files and teaching instructions are retained.

Run `node test-correlation.cjs` and `node test-correlation-ui.cjs`. Independent references are in `validation/correlation-reference.json`, regenerated by `python3 validation/generate-correlation.py` with NumPy and SciPy. Six actual Stata 19 cases are retained in `validation/correlation-stata.csv`; rerun `correlation-stata.do` from the validation folder to regenerate them. These checks cover estimates, all tail/alpha settings, Fisher and slope intervals, densities, transformations, missingness, degenerate cases, navigation, and KaTeX equations. UI checks use a DOM harness, not a browser; visual review remains with the instructor. See `validation/correlation-audit.txt` for the completed checks.

## Matching Stata 19

The t-test calculations follow the supplied Stata 19 ttest manual. The one-sample summary inputs correspond to ttesti; the z demonstration is separate from ttest.

Results use three columns and two rows: observed test statistic, standard error, and confidence interval; then critical value, p-value, and decision. Narrow screens reflow to two or one column. Confidence intervals use the selected normal or t distribution; repeated tail-area explanations are omitted. Commands and software-style output tables are not displayed. Sample labels use Sample 1 and Sample 2. Source acknowledgments appear in a separate About and references section, including Stata 19, Satterthwaite (1946), and Welch (1947). The calculation engine retains complete summaries for numerical verification.

The independent default pools variances. Stata's unequal option uses Satterthwaite degrees of freedom, while its welch option uses the distinct Welch (1947) formula. Fractional degrees of freedom are retained for probabilities and intervals.

Confidence intervals are displayed as [lower bound, upper bound] in dark text. Confidence level is 100(1 − α)%. Intervals follow the selected test direction: two finite bounds for two-tailed tests, a lower bound for right-tailed tests, and an upper bound for left-tailed tests. One-sided display intervals extend to infinity; the calculation engine retains Stata’s two-sided intervals for reference validation. Only the selected alternative's p-value is displayed. The two-sample p-value uses four decimal places, or scientific notation for very small values; the result panel shows t to three decimal places. Other supporting results use up to seven significant digits. Numerical agreement is the target, not a character-for-character reproduction of Stata's table spacing or numeric formatting.

The demos require at least two observations per sample and a positive test standard error. Undefined tests with zero standard error are not plotted. One-sample SD must be positive. Finite sample inputs are required for confidence intervals; infinite slider endpoints are teaching illustrations only. Data entry accepts numbers and Stata missing-value tokens, not variable names, headers, or if/in expressions.

## Validation

Run `node test-math.cjs` and `node test-ttests.cjs`. Eleven reference cases were run in the locally installed Stata 19, with 285 numerical comparisons (including reversal checks) passing at relative/absolute tolerance 1e-9. Cases cover all test methods, nondefault confidence levels, incomplete pairs, and one zero-variance independent group. Expected values are stored in stata-reference.json. The Stata commands and result logs are retained in validation/. License details and local computer paths have been redacted from the log copies; numerical results are unchanged. To rerun the RCADS check, set global RCADS_SOURCE to the local workbook path before running validation/stata-rcads.do.

The full audit adds `node test-audit.cjs` and `node test-ui-audit.cjs`. The first checks 504 independent SciPy values, 200 saved Stata cases (including z-tests and one-sided CI bounds), CI/test agreement, scale transformations, and extreme unit changes. The second exercises 144 UI setting combinations and 108 descriptive-table combinations in a DOM harness, including full-precision decimal inputs, assistant result snapshots, and reset. It does not launch a browser or verify native spinner rendering. See validation/audit-report.txt for findings and limitations. Regenerate independent fixtures with `python3 validation/generate-audit.py` (SciPy required), followed by Stata running validation/stata-audit.do.

The prepublication review and fixes are recorded in `validation/release-audit-2026-11-06.txt`. Invalid one-sample inputs now hide old results until corrected. Unequal-variance degrees of freedom use normalized variance contributions to remain stable across unit changes. Paired-difference charts retain their relative spread for small measurement units. Run `node test-release.cjs` to check every page's local assets, filename case, navigation, KaTeX equations, and inactive chatbot integration.

Visual testing is handled by the instructor. Do not launch a local browser for visual checks without first discussing the need.

## Teaching notes

The decision rule is p < α: reject H₀; p ≥ α: fail to reject H₀.
At exact equality, the display follows this convention explicitly.
For continuous distributions, exact equality has probability zero.

The endpoints p = 0 (and p = 1 for one-tailed tests) require infinite cutoffs.
These endpoints are labeled as infinite, with the marker displayed at the chart edge.

The original t scale illustrates mean + t × SE, with SE held fixed.
SE is a scale factor here, not the standard deviation of the t curve.
For low degrees of freedom, heavy tails require a wide horizontal range.

Normal probabilities use the complementary error function evaluated through a regularized gamma series/continued fraction.
Student's t probabilities use the regularized incomplete beta function.
Quantiles use tail-probability bisection to avoid cancellation at extreme probabilities. These are teaching calculations, not production statistical software.

## Files

- index.html: homepage with one-sample, two-sample, and correlation/regression choices.
- one-sample.html: existing z and t demo, with a link back to the homepage.
- two-sample.html: independent and paired t-test page.
- two-sample.js: two-sample controls and charts.
- correlation.html: Pearson correlation and simple linear regression page.
- correlation-stats.js: complete-pair correlation and OLS calculations, null density, and confidence intervals.
- correlation.js: scatterplot, result panel, descriptive statistics, and null sampling distribution.
- test-correlation.cjs and test-correlation-ui.cjs: independent numerical and interaction checks for the new page.
- ttests.js: Stata-compatible t-test calculations and data parsing.
- ttest-view.js: shared number formatting and compact results display.
- test-ttests.cjs: comparisons with actual Stata results.
- stata-reference.json: expected Stata results.
- math.js: renders methodology equations with the local KaTeX library.
- katex/: bundled library, fonts, and LICENSE.txt; credited in each demo’s About and references section.
- style.css: responsive layout and styling.
- app.js: probability calculations and interactive SVG chart.
- test-math.cjs: optional numerical checks; run with Node.js.

The active demos use local JavaScript and bundled KaTeX assets. They do not upload observations or result summaries, and do not use an AI service.

## Statistics assistant: inactive

The SmolLM2/WebLLM engine was removed after evaluation. Its old launcher has been disconnected from all pages for this release, so students cannot start a missing model or see obsolete download/privacy claims. No model download, API request, or chat interaction is available.

`chat.js`, `chat.css`, `chat-context.js`, and the earlier evaluation materials remain for a future replacement. They are archived prototype files, not active features. Their local-model descriptions do not describe a future hosted API assistant. A replacement needs its own data/privacy wording, a protected API key, and answer evaluation before being enabled. No backend or billing has been configured by this audit.

`node test-chat.cjs` checks the saved prompt rules and confirms the inactive UI is disconnected from all four pages. The old worker/model tests are explicitly skipped because their engine was removed. This does not validate any AI responses.

## Interface guidance

Keep the calculator views minimal: clear input labels, the six results, and references. Avoid repeating legends or restating labels in explanatory paragraphs. Retain only input-format instructions, paired-data requirements, and brief qualifications needed to interpret illustrative charts. Missing-data and infinite-endpoint notices appear only when relevant.

Methodology sections show only the selected test and variance method, with LaTeX equations rendered using locally hosted KaTeX 0.19.0. Native MathML remains as a fallback if the library cannot load. This keeps mathematical typesetting available offline. Reset is the sole button for restoring example inputs.

References follow APA author-date formatting and alphabetical order, with hanging indents. Page ranges retain hyphens per the author’s writing preference. KaTeX’s typesetting credit and local license link are separate from the reference entries.

The Show/Hide button beside the confidence interval result adds a translucent capped interval just below the observed point on the plot. The two-sample plot includes a vertical reference line at zero. It starts hidden and Reset hides it. The interval follows α and the test direction. One-sided intervals end in an arrow at the frame edge; finite bounds determine the axis range even while the interval is hidden. On standardized plots, the parameter interval is transformed using the test standard error (not a confidence interval for the t statistic itself). The one-sample original-scale view shows the population-mean interval in original units. Infinite slider endpoints do not show an interval.
