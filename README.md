# Hypothesis testing demo

Open index.html in a browser. Keep app.js and style.css in the same folder.
No installation, server, internet connection, or account is needed.

## Controls

- Enter sample size, mean under H₀, standard deviation, and the observed sample mean in original units. These inputs stay visible in both views.
- Choose normal (z) or Student's t. For z, use the known population SD; for t, use the sample SD.
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

## Teaching notes

The decision rule is p < α: reject H₀; p ≥ α: fail to reject H₀.
At exact equality, the display follows this convention explicitly.
For continuous distributions, exact equality has probability zero.

The endpoints p = 0 (and p = 1 for one-tailed tests) require infinite cutoffs.
These endpoints are labeled as infinite, with the marker displayed at the chart edge.

The original t scale illustrates mean + t × SE, with SE held fixed.
SE is a scale factor here, not the standard deviation of the t curve.
For low degrees of freedom, heavy tails require a wide horizontal range.

Normal probabilities use a complementary error function approximation.
Student's t probabilities use the regularized incomplete beta function.
Quantiles use bisection. These are teaching calculations, not production statistical software.

## Files

- index.html: controls and page structure.
- style.css: responsive layout and styling.
- app.js: probability calculations and interactive SVG chart.
- test-math.cjs: optional numerical checks; run with Node.js.

No user data are saved or sent anywhere.
