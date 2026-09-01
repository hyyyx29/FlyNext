# FlyNext ✈️

A full-stack travel booking platform: search flights, book hotel rooms, and manage complete trips in one place.

Built with **Next.js 15 (App Router)**, **Prisma**, and **SQLite**, exposing ~30 REST endpoints. Built together with a teammate.

## Features

- 🔐 **Authentication** — JWT auth with access/refresh token rotation (register, login, logout, refresh)
- ✈️ **Flights** — one-way and round-trip search with multi-leg itineraries, booking and cancellation via an external flight-supplier API
- 🏨 **Hotels** — hotel owners can create hotels, define room types, pricing and availability; travellers can search by city, date range, price and star rating, then book
- 🧳 **Itineraries** — combine flight and hotel bookings into a single trip
- 🧾 **Checkout & invoices** — checkout flow with card validation and downloadable PDF invoices (pdfkit)
- 🔔 **Notifications** — in-app notifications with unread counts for booking events

## Tech stack

Next.js 15 · React 19 · Prisma 6 · SQLite · Tailwind CSS 4 · jsonwebtoken · bcryptjs · pdfkit · Jest + Supertest

## Getting started

```bash
npm install
cp .env.example .env        # then edit the values

npx prisma migrate deploy   # create the SQLite database
npx prisma db seed          # load bundled city & airport data
npm run dev                 # http://localhost:3000
```

City and airport seed data is bundled in `prisma/seed_data/`, so the database seeds without any network access. Live flight search and booking require credentials for the external flight-supplier API (`AFS_BASE_URL` / `AFS_API_KEY` in `.env`); every hotel, auth, itinerary and notification feature runs fully locally.

`startup.sh` automates the full setup (reset, migrate, fetch fresh seed data, seed), and `run.sh` builds and starts a production server.

## API documentation

- [`collection.openapi`](collection.openapi) — OpenAPI 3 spec for all endpoints
- [`postman_collection.json`](postman_collection.json) — ready-to-import Postman collection
