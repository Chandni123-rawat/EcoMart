# Historical pricing data

`historical-prices.csv` contains the 200 rows from the `Listings` sheet of the supplied GREEN_Second_Life_200_Listings workbook. Prices are in Indian rupees and ages are in years. The CSV retains the source category and condition labels, pricing fields, and descriptive notes.

| Source category | Records |
| --- | ---: |
| Book | 80 |
| Calculator | 60 |
| Cycle | 60 |

The workbook records a sold price for each entry. These records are kept separate from the active demo inventory in `backend/prisma/seed.js`. The fair-price estimator reads this CSV to compare similar historical sales. The workbook includes no Academic Equipment records or transaction dates, and the sales provenance has not been independently verified.
