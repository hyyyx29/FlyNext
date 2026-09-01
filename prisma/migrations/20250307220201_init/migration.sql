-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoomAvailabilityRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "availability" INTEGER NOT NULL,
    "roomTypeId" INTEGER,
    CONSTRAINT "RoomAvailabilityRecord_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoomAvailabilityRecord" ("availability", "date", "id", "roomTypeId") SELECT "availability", "date", "id", "roomTypeId" FROM "RoomAvailabilityRecord";
DROP TABLE "RoomAvailabilityRecord";
ALTER TABLE "new_RoomAvailabilityRecord" RENAME TO "RoomAvailabilityRecord";
CREATE TABLE "new_RoomType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "amenities" JSONB NOT NULL,
    "pricePerNight" REAL NOT NULL,
    "images" JSONB NOT NULL,
    "currentAvailability" INTEGER NOT NULL,
    "hotelId" INTEGER NOT NULL,
    CONSTRAINT "RoomType_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoomType" ("amenities", "currentAvailability", "hotelId", "id", "images", "name", "pricePerNight") SELECT "amenities", "currentAvailability", "hotelId", "id", "images", "name", "pricePerNight" FROM "RoomType";
DROP TABLE "RoomType";
ALTER TABLE "new_RoomType" RENAME TO "RoomType";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
