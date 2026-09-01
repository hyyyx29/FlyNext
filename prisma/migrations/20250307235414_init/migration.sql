/*
  Warnings:

  - Made the column `roomTypeId` on table `RoomAvailabilityRecord` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hotel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "starRating" INTEGER NOT NULL,
    "images" JSONB NOT NULL,
    "ownerId" INTEGER,
    CONSTRAINT "Hotel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Hotel" ("address", "id", "images", "location", "logo", "name", "ownerId", "starRating") SELECT "address", "id", "images", "location", "logo", "name", "ownerId", "starRating" FROM "Hotel";
DROP TABLE "Hotel";
ALTER TABLE "new_Hotel" RENAME TO "Hotel";
CREATE TABLE "new_HotelReservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "itineraryId" INTEGER,
    "hotelId" INTEGER,
    "roomTypeId" INTEGER,
    "checkIn" DATETIME NOT NULL,
    "checkOut" DATETIME NOT NULL,
    "price" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HotelReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HotelReservation_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HotelReservation_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HotelReservation_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_HotelReservation" ("checkIn", "checkOut", "createdAt", "hotelId", "id", "itineraryId", "price", "roomTypeId", "status", "userId") SELECT "checkIn", "checkOut", "createdAt", "hotelId", "id", "itineraryId", "price", "roomTypeId", "status", "userId" FROM "HotelReservation";
DROP TABLE "HotelReservation";
ALTER TABLE "new_HotelReservation" RENAME TO "HotelReservation";
CREATE UNIQUE INDEX "HotelReservation_itineraryId_key" ON "HotelReservation"("itineraryId");
CREATE TABLE "new_RoomAvailabilityRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "availability" INTEGER NOT NULL,
    "roomTypeId" INTEGER NOT NULL,
    CONSTRAINT "RoomAvailabilityRecord_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoomAvailabilityRecord" ("availability", "date", "id", "roomTypeId") SELECT "availability", "date", "id", "roomTypeId" FROM "RoomAvailabilityRecord";
DROP TABLE "RoomAvailabilityRecord";
ALTER TABLE "new_RoomAvailabilityRecord" RENAME TO "RoomAvailabilityRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
