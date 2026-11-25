# GREEN · Second Life

A campus marketplace for buying, selling and exchanging used academic essentials. The demo uses three switchable student profiles and four seeded listings. All amounts are in Indian rupees.

## Run locally

Install a supported Node.js release (22.12+ recommended), then open a terminal in this folder:

```bash
npm ci
npm start
```

Open http://127.0.0.1:5173 on the same computer. Keep the terminal open while using the app. The first launch creates and seeds a local SQLite database through Prisma, builds the frontend, and starts the Express server. The database persists in `backend/prisma/green-local.db`. Demo listings and user-created activity persist across restarts.

For live frontend and API development, run `npm run db:deploy` and `npm run db:seed` once, then run `npm run dev`. Vite opens on port 5173 and proxies the API and uploads to Express on port 4000.

An environment file is optional. Use `backend/.env.example` if you need to override the database path, port, frontend origin, or configure Cloudinary. Set `API_PROXY_TARGET` in `frontend/.env` for a custom development API port. A separate frontend can set `VITE_API_URL` to the complete API base ending in `/api`.

Image uploads accept up to five JPG, PNG or WebP files, at 5 MB per image. They use `backend/uploads/` by default. Set all three Cloudinary variables in `backend/.env` to use Cloudinary instead. Keep the uploads directory available between runs when using local storage.

## Try the demo

1. As Aisha Sharma, open the Campus Roadster Bicycle and choose **Request purchase**.
2. Switch to Kabir Mehta, open **My Activity**, and accept the incoming request. The bicycle is now reserved. Both students can reveal the other participant's demo contact to see where offline coordination would start.
3. Confirm handover as Kabir. Switch to Aisha and confirm again. The bicycle becomes sold.
4. To try a swap, browse an available listing marked **Swap** and send a description of the item you’re offering. The same acceptance and handover flow applies.

Use **Sell an Item** to publish a listing and **My Activity → My listings** to edit or delete it while available and free of pending requests. The demo seed is safe to rerun and preserves existing listing activity.

## Structure

```text
frontend/
  public/images/       Sample product photography
  src/components/     Shared UI and shadcn-style Button
  src/                 React pages, API client and design system
backend/
  prisma/              Schema, initial migration and demo seed
  src/routes/          REST routing
  src/controllers/     Listing and request operations
  src/services/        Prisma, transaction locking and image storage
data-analytics/        Reserved home for historical pricing work
package.json          Local startup commands
```

## Database schema

| Prisma model | Fields and relationships |
| --- | --- |
| User | Demo student ID, name, program and demo email. Has many listings and outgoing requests. |
| Category | ID and unique name. Has many listings. |
| Listing | Category and seller foreign keys, name, brand, model, description, age, condition, original and selling prices, image URLs, swap flag, status and creation time. |
| PurchaseRequest | Listing and buyer foreign keys, kind, optional swap offer, status and creation time. Unique per listing and buyer. |
| Transaction | Unique request foreign key, agreed purchase price for purchases, buyer and seller confirmation times, completion time and creation time. |

SQLite serializes listing mutations before request decisions and confirmations read the current state. Accepting a request reserves the listing, creates its transaction and rejects any competing pending requests. Both confirmations are recorded before the listing becomes sold.

## REST API

Calls marked **Demo student** require `X-Demo-User` with one of the seeded IDs, `aisha`, `kabir` or `maya`. The header switches the demo identity.

| Method | Route | Behavior |
| --- | --- | --- |
| GET | /api/health | Check SQLite connectivity |
| GET | /api/users | List demo student profiles |
| GET | /api/categories | List categories |
| GET | /api/analytics/historical | Compare historical prices by category, optionally filtered by condition |
| GET | /api/pricing/estimate | Estimate a fair price from comparable historical records |
| GET | /api/listings | Search, filter and sort listings |
| GET | /api/listings/:id | Read listing and seller profile |
| POST | /api/listings | Publish with multipart listing fields and an image. Demo student. |
| PUT | /api/listings/:id | Replace listing details and optionally images. Demo seller. |
| DELETE | /api/listings/:id | Delete an eligible listing. Demo seller. |
| GET | /api/requests | View sent and received requests. Demo student. |
| POST | /api/requests | Send `{ listingId, kind, offer? }`. Kind defaults to `PURCHASE`; `SWAP` requires an offer and an eligible listing. Demo buyer. |
| PATCH | /api/requests/:id/decision | Send `{ decision: "accept" }` or `{ decision: "reject" }`. Demo seller. |
| POST | /api/requests/:id/confirm | Record the caller's handover confirmation. Demo participant. |
| GET | /api/requests/:id/contact | Reveal the other participant's demo contact after acceptance. Demo participant. |

Listing queries support `search`, `category`, `minPrice`, `maxPrice`, `brand`, `maxAge`, `condition` (`LIKE_NEW`, `GOOD` or `FAIR`), `available=true`, `seller=me` (demo student required), and `sort` (`price-asc` or `price-desc`, default newest).

Listing writes use multipart form data: `name`, `categoryId`, `brand`, `model`, `originalPrice`, `age`, `condition`, `description`, `price`, `swap` (`true` or `false`), and one or more `images` parts. On edit, omit the image parts to retain existing photos.

Socket.IO delivers in-app notices for new purchase and swap requests, seller decisions, and handover confirmations. The marketplace refreshes availability when an item becomes reserved or sold. Request notices go to the relevant demo profiles. Open two tabs, select a different student in each tab, and follow the demo steps to see the updates. A reconnect refreshes current marketplace and activity data. Notices are shown while connected. Open **Analytics** to compare historical original and sold prices with a Recharts chart and a category statistics table. The condition filter applies to both views. The seller form can estimate a fair price from the historical CSV. Enter category, condition, age and original price, then click **Estimate fair price**. Applying the estimate is optional, and the selling price remains editable.

The estimate endpoint takes `category`, `condition`, `age` and `originalPrice`. It uses the median sold-to-original-price ratio from records in the same category and condition within one year of the entered age. The 25th and 75th percentiles give the displayed range. The workbook's Excellent condition is treated as Like new. A minimum of five comparable records is required. Academic Equipment currently has no pricing records.
