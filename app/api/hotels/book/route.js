// app/api/hotels/book/route.js
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(request) {
  const payload = await verifyToken(request);
  if (!payload) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { hotelId, roomTypeId, checkIn, checkOut } = body;
    if (!hotelId || !roomTypeId || !checkIn || !checkOut) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // search for the room availability
    const roomType = await prisma.roomType.findUnique({
      where: { id: Number(roomTypeId) },
    });
    if (!roomType) {
      return new Response(JSON.stringify({ message: "Room type not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (roomType.currentAvailability <= 0) {
      return new Response(JSON.stringify({ message: "No rooms available" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = Math.abs(checkOutDate - checkInDate);
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const price = roomType.pricePerNight * nights;

    // create hotelReservation
    const reservation = await prisma.hotelReservation.create({
      data: {
        user: { connect: { id: payload.userId } },
        hotel: { connect: { id: Number(hotelId) } },
        roomType: { connect: { id: Number(roomTypeId) } },
        checkIn: checkInDate,
        checkOut: checkOutDate,
        price: price,
      },
    });

    // update the room availability (-1)
    await prisma.roomType.update({
      where: { id: Number(roomTypeId) },
      data: { currentAvailability: roomType.currentAvailability - 1 },
    });

    return new Response(
      JSON.stringify({
        message: "Hotel reservation created successfully.",
        reservation,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
