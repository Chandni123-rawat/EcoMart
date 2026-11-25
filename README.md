# GREEN · Second Life

GREEN · Second Life is a campus marketplace for buying, selling, and swapping used books, calculators, bicycles, and academic equipment. Students can find affordable essentials, pass on items they no longer need, and arrange handovers on campus.

## Features

| Phase | What it includes |
| --- | --- |
| **1. Marketplace** | Responsive homepage, featured listings, three switchable demo student profiles, product details, search, filters, sorting, photo uploads, listing management, purchase requests, and swap offers. |
| **2. Fair pricing** | A suggested asking price, a typical price range, and a count of comparable sales. The seller can apply the suggestion and edit the final price. |
| **3. Analytics** | Charts and tables comparing original prices, sold prices, and resale value across categories and conditions. |
| **4. Live updates** | Socket.IO updates for new requests, seller decisions, and handover confirmations. |
| **5. Notification inbox** | Saved notifications for each demo profile, an unread badge, and controls to mark one or all notifications as read. |

## Run on Windows with VS Code

1. Extract the project ZIP or clone the repository.
2. In VS Code, select **File → Open Folder** and open `green-second-life`. You should see `package.json`, `frontend/`, and `backend/` at the same level.
3. Install **Node.js 22.12 or newer**, then open **Terminal → New Terminal**.
4. Run the following commands.

```powershell
node -v
npm ci
npm start
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Keep the terminal open while using the app. Press `Ctrl+C` to stop it.

`npm start` applies database migrations, seeds the demo data, builds the frontend, and starts the Express server. **Docker is not required.** If PowerShell blocks `npm.ps1`, switch the VS Code terminal to **Command Prompt** or use `npm.cmd ci` and `npm.cmd start`.

## Try the demo

### Purchase and handover

1. Open the app in two browser tabs. Select **Aisha Sharma** in one and **Kabir Mehta** in the other.
2. As Aisha, open **Campus Roadster Bicycle** and select **Request purchase**.
3. As Kabir, open **My Activity** and accept the incoming request. The bicycle becomes **Reserved**.
4. Both students can view demo contact details and arrange payment and handover offline.
5. Confirm the handover as Kabir first, then as Aisha. The listing stays reserved after the first confirmation and becomes **Sold** after the second.
6. Open the **bell icon** to see the saved notifications. Try **Mark read** or **Mark all read**.

If the bicycle has already been used in a demo, choose another available listing and switch the seller tab to that listing’s owner.

### Swap and listing management

- To test an exchange, open an available listing marked **Swap**, choose **Propose a swap**, and describe your offer. The seller can accept or reject it in **My Activity**.
- To test listing management, open **Sell an Item**, fill in the details, upload a photo, and publish. Use **My Activity → My listings** to edit or delete an available listing with no pending requests.
- To test the inbox while offline, close the seller’s tab before sending a request. Reopen the app, select the seller, and check the bell icon.

## Historical dataset and fair pricing

The [historical pricing CSV](data-analytics/historical-prices.csv) contains **200 records** from the supplied workbook: **80 books, 60 calculators, and 60 bicycles**. The fair-price estimator and analytics dashboard use this dataset. The active marketplace has four separate seeded demo listings.

The estimator finds records in the same category and condition within one year of the entered age. When at least five records match, it calculates the median **sold price ÷ original price** ratio and applies it to the seller’s original purchase price. The 25th and 75th percentiles define the typical range. **No machine-learning model was trained.**

To check a known result, open **Sell an Item** and enter:

| Field | Value |
| --- | --- |
| Category | Books |
| Condition | Good |
| Age | 2 years |
| Original price | ₹1,000 |

Select **Estimate fair price**. The expected suggestion is **₹618.82**, with a range of **₹575.24–₹650** from **26 comparable records**. The seller can choose **Use suggested price** or enter a different price. The dataset has no Academic Equipment records, so those listings use manual pricing.

Open **Analytics** to compare average original price, average sold price, and value retained. Change the condition filter to update both the chart and table.

## Technology stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide React, and Recharts
- **Backend:** Node.js and Express
- **Database:** SQLite with Prisma
- **Real-time updates:** Socket.IO
- **Image uploads:** Multer with local storage by default and optional Cloudinary storage

## Project structure

```text
green-second-life/
├── frontend/        # React pages, shared components, and styles
├── backend/
│   ├── prisma/      # Database schema, migrations, and demo seed
│   └── src/         # API routes, controllers, and services
├── data-analytics/  # Historical pricing CSV and dataset notes
├── package.json
└── README.md
```

## API overview

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Check database connectivity |
| `GET /api/users` | List demo student profiles |
| `GET /api/categories` | List product categories |
| `GET /api/listings` | Browse, search, filter, and sort listings |
| `GET /api/listings/:id` | View listing details and seller information |
| `POST /api/listings` | Publish a listing with photos |
| `PUT /api/listings/:id` | Edit an eligible listing |
| `DELETE /api/listings/:id` | Delete an eligible listing |
| `GET /api/requests` | View sent and received requests |
| `POST /api/requests` | Send a purchase or swap request |
| `PATCH /api/requests/:id/decision` | Accept or reject a request |
| `POST /api/requests/:id/confirm` | Record handover confirmation |
| `GET /api/requests/:id/contact` | View the other participant’s demo contact after acceptance |
| `GET /api/pricing/estimate` | Estimate a fair price from comparable sales |
| `GET /api/analytics/historical` | Get historical category statistics |
| `GET /api/notifications` | Read the current demo student’s inbox |
| `PATCH /api/notifications/:id/read` | Mark one notification as read |
| `PATCH /api/notifications/read-all` | Mark all notifications as read |

Personalized API calls use the `X-Demo-User` header with `aisha`, `kabir`, or `maya`. The profile selector handles this in the app.

## Local data and configuration

The SQLite database is stored in `backend/prisma/green-local.db`. Uploaded photos are stored in `backend/uploads/` by default. Keep both if you want to retain listings, photos, requests, and notifications between project versions. Environment overrides are optional and documented in `backend/.env.example` and `frontend/.env.example`.

When pushing to GitHub, keep the source, `package-lock.json`, Prisma migrations, and historical CSV. The repository’s `.gitignore` excludes installed dependencies, build output, `.env` files, local databases, and uploaded photos.
