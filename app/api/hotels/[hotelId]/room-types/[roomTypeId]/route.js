// app/api/hotels/[hotelId]/room-types/route.js
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/hotels/[hotelId]/room-types/[roomTypeId]
export async function GET(request, { params }) {
  const { hotelId, roomTypeId } = await params;
  const { searchParams } = new URL(request.url);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  try {
    const filter = { 
      roomTypeId: Number(roomTypeId) 
    };
    
    if (checkIn && checkOut) {
      filter.date = {
        gte: new Date(checkIn),
        lte: new Date(checkOut),
      };
    }

    const availabilityRecords = await prisma.roomAvailabilityRecord.findMany({
      where: filter,
    });
    return new Response(JSON.stringify({ availabilityRecords: availabilityRecords }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error fetching room type:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// PUT /api/hotels/[hotelId]/room-types/[roomTypeId]
export async function PUT(request, { params }) {
  const { hotelId, roomTypeId } = await params;

  // verify login status
  const payload = await verifyToken(request);
  if (!payload) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // check if the hotel exists and the user is the owner
  const hotel = await prisma.hotel.findUnique({ where: { id: Number(hotelId) } });
  if (!hotel) {
    return new Response(JSON.stringify({ message: "Hotel not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (hotel.ownerId !== payload.userId) {
    return new Response(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { name, amenities, pricePerNight, images, currentAvailability } = body;
    const updatedRoomType = await prisma.roomType.update({
      where: { id: Number(roomTypeId) },
      data: {
        name: name,
        amenities: amenities,
        pricePerNight: pricePerNight,
        images: images,
        currentAvailability: currentAvailability,
      },
    });
    return new Response(
      JSON.stringify({ message: "Room type updated", roomType: updatedRoomType }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating room type:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// DELETE /api/hotels/[hotelId]/room-types/[roomTypeId]
export async function DELETE(request, { params }) {
  const { hotelId, roomTypeId } = await params;

  // verify login status
  const payload = await verifyToken(request);
  if (!payload) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // check if the hotel exists and the user is the owner
  const hotel = await prisma.hotel.findUnique({ where: { id: Number(hotelId) } });
  if (!hotel) {
    return new Response(JSON.stringify({ message: "Hotel not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (hotel.ownerId !== payload.userId) {
    return new Response(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  try {
    await prisma.roomType.delete({
      where: { id: Number(roomTypeId) },
    });
    return new Response(JSON.stringify({ message: "Room type deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting room type:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
