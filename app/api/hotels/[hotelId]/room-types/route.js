// app/api/hotels/[hotelId]/room-types/route.js
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/hotels/[hotelId]/room-types
export async function GET(request, { params }) {
  const { hotelId } = await params;
  try {
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId: Number(hotelId) },
    });
    return new Response(JSON.stringify({ roomTypes: roomTypes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching room types:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST /api/hotels/[hotelId]/room-types
export async function POST(request, { params }) {
  const { hotelId } = await params;
  const payload = await verifyToken(request);
  if (!payload) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  // check if the user exists and the user is the owner
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
    if (!name || !pricePerNight || currentAvailability === undefined) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const roomType = await prisma.roomType.create({
      data: {
        name,
        amenities,
        pricePerNight: parseFloat(pricePerNight),
        images,
        currentAvailability: Number(currentAvailability),
        hotel: { connect: { id: Number(hotelId) } },
      },
    });
    return new Response(
      JSON.stringify({ message: "Room type created" }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating room type:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
