# Hypothesis testing demo

Open index.html in a browser and choose One-sample tests or Two-sample tests.
Keep all HTML, JavaScript, and CSS files in the same folder.
No installation, server, internet connection, or account is needed.

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

## Matching Stata 19

The t-test calculations follow the supplied Stata 19 ttest manual. The one-sample summary inputs correspond to ttesti; the z demonstration is separate from ttest.

Results use three columns and two rows: observed test statistic, standard error, and confidence interval; then critical value, p-value, and decision. Narrow screens reflow to two or one column. Confidence intervals use the selected normal or t distribution; repeated tail-area explanations are omitted. Commands and software-style output tables are not displayed. Sample labels use Sample 1 and Sample 2. Source acknowledgments appear in a separate About and references section, including Stata 19, Satterthwaite (1946), and Welch (1947). The calculation engine retains complete summaries for numerical verification.

The independent default pools variances. Stata's unequal option uses Satterthwaite degrees of freedom, while its welch option uses the distinct Welch (1947) formula. Fractional degrees of freedom are retained for probabilities and intervals.

Confidence intervals are displayed as [lower bound, upper bound] in dark text. Confidence level is 100(1 − α)%. Intervals follow the selected test direction: two finite bounds for two-tailed tests, a lower bound for right-tailed tests, and an upper bound for left-tailed tests. One-sided display intervals extend to infinity; the calculation engine retains Stata’s two-sided intervals for reference validation. Only the selected alternative's p-value is displayed. The two-sample p-value uses four decimal places, or scientific notation for very small values; the result panel shows t to three decimal places. Other supporting results use up to seven significant digits. Numerical agreement is the target, not a character-for-character reproduction of Stata's table spacing or numeric formatting.

The demos require at least two observations per sample and a positive test standard error. Undefined tests with zero standard error are not plotted. One-sample SD must be positive. Finite sample inputs are required for confidence intervals; infinite slider endpoints are teaching illustrations only. Data entry accepts numbers and Stata missing-value tokens, not variable names, headers, or if/in expressions.

## Validation

Run `node test-math.cjs` and `node test-ttests.cjs`. Eleven reference cases were run in the locally installed Stata 19, with 285 numerical comparisons (including reversal checks) passing at relative/absolute tolerance 1e-9. Cases cover all test methods, nondefault confidence levels, incomplete pairs, and one zero-variance independent group. Expected values are stored in stata-reference.json. The Stata commands and original result logs are retained in validation/.

The full audit adds `node test-audit.cjs` and `node test-ui-audit.cjs`. The first checks 504 independent SciPy values, 200 new Stata cases (including z-tests and one-sided CI bounds), CI/test agreement, and scale transformations. The second exercises 90 UI setting combinations in a DOM harness, including full-precision decimal inputs and reset. It does not launch a browser or verify native spinner rendering. See validation/audit-report.txt for findings and limitations. Regenerate independent fixtures with `python3 validation/generate-audit.py` (SciPy required), followed by Stata running validation/stata-audit.do.

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

- index.html: homepage with one-sample and two-sample choices.
- one-sample.html: existing z and t demo, with a link back to the homepage.
- two-sample.html: independent and paired t-test page.
- two-sample.js: two-sample controls and charts.
- ttests.js: Stata-compatible t-test calculations and data parsing.
- ttest-view.js: shared number formatting and compact results display.
- test-ttests.cjs: comparisons with actual Stata results.
- stata-reference.json: expected Stata results.
- math.js: renders methodology equations with the local KaTeX library.
- katex/: bundled library, fonts, and LICENSE.txt; credited in each demo’s About and references section.
- style.css: responsive layout and styling.
- app.js: probability calculations and interactive SVG chart.
- test-math.cjs: optional numerical checks; run with Node.js.

No user data are saved or sent anywhere.

## Interface guidance

Keep the four test views minimal: clear input labels, the six results, and references. Avoid repeating legends or restating labels in explanatory paragraphs. Retain only input-format instructions, paired-data requirements, and brief qualifications needed to interpret illustrative charts. Missing-data and infinite-endpoint notices appear only when relevant.

Methodology sections show only the selected test and variance method, with LaTeX equations rendered using locally hosted KaTeX 0.19.0. Native MathML remains as a fallback if the library cannot load. This keeps mathematical typesetting available offline. Reset is the sole button for restoring example inputs.

References follow APA author-date formatting and alphabetical order, with hanging indents. Page ranges retain hyphens per the author’s writing preference. KaTeX’s typesetting credit and local license link are separate from the reference entries.

The Show/Hide button beside the confidence interval result adds a translucent capped interval just below the observed point on the plot. The two-sample plot includes a vertical reference line at zero. It starts hidden and Reset hides it. The interval follows α and the test direction. One-sided intervals end in an arrow at the frame edge; finite bounds determine the axis range even while the interval is hidden. On standardized plots, the parameter interval is transformed using the test standard error (not a confidence interval for the t statistic itself). The one-sample original-scale view shows the population-mean interval in original units. Infinite slider endpoints do not show an interval.
