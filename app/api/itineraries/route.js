import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/itineraries
export async function GET(request) {
  try {
    // Authenticate and extract the user identifier
    const currentUser = await verifyToken(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = currentUser.userId || currentUser.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid user identifier" }, { status: 400 });
    }

    // Fetch itineraries for the authenticated user.
    // For Flight, we return all scalar fields by setting flight: true.
    const itineraries = await prisma.itinerary.findMany({
      where: { userId: userId },
      include: {
        flight: true, // returns all scalar fields (including departure, arrival, etc.)
        hotel: {
          include: {
            hotel: {
              include: {
                name: true,
                address: true,
                location: true,
              },
            },
            roomType: {
              include: {
                name: true,
              },
            },
            checkIn: true,
            checkOut: true,
            price: true,
            status: true,
          },
        },
        totalPrice: true,
        bookingDate: true,
        status: true,
      },
      orderBy: { bookingDate: "desc" },
    });
    return NextResponse.json({ itineraries }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve itineraries" },
      { status: 500 }
    );
  }
}

// POST /api/itineraries
export async function POST(request) {
  try {
    const currentUser = await verifyToken(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = currentUser.userId || currentUser.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid user identifier" }, { status: 400 });
    }

    // Expecting initial reservation IDs in the request body
    const { flightReservationId, hotelReservationId } = await request.json();

    const result = await prisma.$transaction(async (prisma) => {
      const [flightReservation, hotelReservation] = await Promise.all([
        flightReservationId
          ? prisma.flightReservation.findUnique({
              where: { id: Number(flightReservationId) },
              select: { userId: true, itineraryId: true, price: true },
            })
          : null,
        hotelReservationId
          ? prisma.hotelReservation.findUnique({
              where: { id: Number(hotelReservationId) },
              select: { userId: true, itineraryId: true, price: true },
            })
          : null,
      ]);

      // Verify flight reservation if provided
      if (flightReservationId) {
        if (!flightReservation) {
          throw new Error("Flight reservation not found");
        }
        if (flightReservation.userId !== userId) {
          throw new Error("Unauthorized flight reservation access");
        }
        if (flightReservation.itineraryId) {
          throw new Error("Flight reservation already linked");
        }
      }

      // Verify hotel reservation if provided
      if (hotelReservationId) {
        if (!hotelReservation) {
          throw new Error("Hotel reservation not found");
        }
        if (hotelReservation.userId !== userId) {
          throw new Error("Unauthorized hotel reservation access");
        }
        if (hotelReservation.itineraryId) {
          throw new Error("Hotel reservation already linked");
        }
      }

      // Calculate total price from available reservations
      const totalPrice =
        (hotelReservation ? hotelReservation.price : 0) +
        (flightReservation ? flightReservation.price : 0);

      // Create itinerary record with default empty values for card info.
      const itinerary = await prisma.itinerary.create({
        data: {
          userId: userId,
          totalPrice: totalPrice,
          status: "DRAFT",
          cardNumber: "", // default empty string
          cardExpiry: "", // default empty string
        },
      });

      // Update reservations with the new itinerary id
      const updatePromises = [];
      if (flightReservationId) {
        updatePromises.push(
          prisma.flightReservation.update({
            where: { id: Number(flightReservationId) },
            data: { itineraryId: itinerary.id },
          })
        );
      }
      if (hotelReservationId) {
        updatePromises.push(
          prisma.hotelReservation.update({
            where: { id: Number(hotelReservationId) },
            data: { itineraryId: itinerary.id },
          })
        );
      }
      await Promise.all(updatePromises);

      // Return the newly created itinerary with some basic details
      return prisma.itinerary.findUnique({
        where: { id: itinerary.id },
        include: {
          id: true,
          flight: flightReservationId ? true : false,
          hotel: hotelReservationId ? true : false,
          status: true,
        },
      });
    });

    return NextResponse.json(
      { message: "Itinerary created successfully", reservations: result },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
