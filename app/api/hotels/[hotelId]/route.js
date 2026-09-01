// app/api/hotels/[hotelId]/route.js
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/hotels/:hotelId
export async function GET(request, { params }) {
  const { hotelId } = await params;
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: Number(hotelId) },
      include: { roomTypes: true },
    });

    if (!hotel) {
      return new Response(
        JSON.stringify({ error: "Hotel not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ hotel }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching hotel:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT /api/hotels/:hotelId
export async function PUT(request, { params }) {
  const { hotelId } = await params;

  // verify token
  const payload = await verifyToken(request);
  if (!payload) {
    return new Response(
      JSON.stringify({ message: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // check if the hotel exists, and the user is the owner
  const hotel = await prisma.hotel.findUnique({
    where: { id: Number(hotelId) },
  });
  if (!hotel) {
    return new Response(
      JSON.stringify({ message: "Hotel not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  if (hotel.ownerId !== payload.userId) {
    return new Response(
      JSON.stringify({ message: "Operation is forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { name, logo, address, location, starRating, images } = body;
    const updatedHotel = await prisma.hotel.update({
      where: { id: Number(hotelId) },
      data: {
        name,
        logo,
        address,
        location,
        starRating: starRating ? Number(starRating) : undefined,
        images,
      },
    });

    return new Response(
      JSON.stringify({ message: "Hotel updated", hotel: updatedHotel }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating hotel:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE /api/hotels/:hotelId
export async function DELETE(request, { params }) {
  const { hotelId } = await params;
  
  // verify token
  const payload = await verifyToken(request);
  if (!payload) {
    return new Response(
      JSON.stringify({ message: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // check if the hotel exists, and the user is the owner
  const hotel = await prisma.hotel.findUnique({
    where: { id: Number(hotelId) },
  });
  if (!hotel) {
    return new Response(
      JSON.stringify({ message: "Hotel not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  if (hotel.ownerId !== payload.userId) {
    return new Response(
      JSON.stringify({ message: "Operation is forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await prisma.hotel.delete({
      where: { id: Number(hotelId) },
    });
    return new Response(
      JSON.stringify({ message: "Hotel deleted" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting hotel:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
