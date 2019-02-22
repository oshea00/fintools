# Finance Tools
## Asset Allocation
Maintaining a portfolio to target certain allocation targets. Including the ability to re-balance the portfolio to targets and generate optimal trades to achieve current or revised target allocations. Prices update automatically during market hours.
### Rebalancing Methodology
When rebalancing the portolfio, the beginning and ending portoflio balance should be within a min/max balance range/percentage. Also, the total deviation of target vs actual weights after rebalancing should not exceed a desired tolerance. To achieve this, the current allocations, prices, and target weights are passed to an optimizer which is given these constraints. The optimizer chooses the best set of whole asset trades which approaches the target weights. Currently, this does not take cash into account, or allow leverage in trades (synthetic cash). Tolerances are currently fixed at +/- 1%.
## Asset Correlation
Shows how to compare assets to determine correlation in price movements. Normally, a portfolio manager wants assets that are not highly correlated in order to reduce market risk.
## Efficient Frontier
Use Monte Carlo analysis to determine risk adjusted returns for randomly selected asset allocations. The goal is to show (retroactively) allocations which provided the most return for a desired risk level.
## Research
Stock picker, name and/or symbol search. Company information.
## Screen Shots
[Fintools Home](https://futurtrends-fintools.herokuapp.com/)

![Home Page](https://raw.githubusercontent.com/oshea00/fintools/master/static/images/home.png)

![Efficient Frontier](https://raw.githubusercontent.com/oshea00/fintools/master/static/images/efficient.png)

![Asset Correlation](https://raw.githubusercontent.com/oshea00/fintools/master/static/images/corr.png)

![Research](https://raw.githubusercontent.com/oshea00/fintools/master/static/images/research.png)

![Rebalancing](https://raw.githubusercontent.com/oshea00/fintools/master/static/images/rebalance.png)

