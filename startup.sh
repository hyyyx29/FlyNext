#!/bin/bash
set -e

ENV_FILE="./.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "Error: .env file not found" >&2
  exit 1
fi

if [ -z "$DATABASE_URL" ] || [ -z "$AFS_API_KEY" ]; then
  echo "Error: Missing environment variables" >&2
  exit 1
fi

# reset database (development only)
echo "Resetting database..."
npx prisma migrate reset --force || {
  echo "Database reset failed! Check your DATABASE_URL permissions" >&2
  exit 1
}

echo "Installing dependencies..."
npm install
npm install pdfkit

echo "Applying migrations..."
npx prisma migrate deploy || { echo "Migration failed" >&2; exit 1; }

echo "Generating Prisma Client..."
npx prisma generate || { echo "Client generation failed" >&2; exit 1; }

mkdir -p prisma/seed_data || { echo "Cannot create seed_data" >&2; exit 1; }

echo "Fetching cities..."
curl -s -H "x-api-key: $AFS_API_KEY" "$AFS_BASE_URL/api/cities" > prisma/seed_data/cities.json || { echo "Failed to fetch cities" >&2; exit 1; }

echo "Fetching airports..."
curl -s -H "x-api-key: $AFS_API_KEY" "$AFS_BASE_URL/api/airports" > prisma/seed_data/airports.json || { echo "Failed to fetch airports" >&2; exit 1; }

echo "Seeding database..."
npx prisma db seed

echo "Startup completed successfully"
exit 0