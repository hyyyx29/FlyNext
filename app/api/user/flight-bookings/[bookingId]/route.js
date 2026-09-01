import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request, { params }) {
	try {
		const currentUser = await verifyToken(request);
		if (!currentUser) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

        const { bookingId } = params;
		const booking = await prisma.flightReservation.findUnique({
			where: {
				id: parseInt(bookingId),
				userId: currentUser.id,
			},
			select: {
				id: true,
				afsBookingId: true,
				departure: true,
				arrival: true,
				price: true,
				status: true,
				createdAt: true,
			},
		});

		if (!booking) {
			return NextResponse.json(
				{ error: "Booking not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			booking: {
				...booking,
				departure: {
					date: booking.departure.date,
					airport: booking.departure.airport,
				},
				arrival: {
					date: booking.arrival.date,
					airport: booking.arrival.airport,
				},
			},
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch flight booking details" },
			{ status: 500 }
		);
	}
}
