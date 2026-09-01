import { NextResponse } from "next/server";
import { createBooking } from "@/lib/afs-client";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
	try {
		const user = verifyToken(request);
		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}
		const body = await request.json();

		// Validate required fields
		const requiredFields = [
			"email",
			"firstName",
			"lastName",
			"passportNumber",
			"flightIds",
		];
		const missing = requiredFields.filter((field) => !body[field]);
		if (missing.length) {
			return NextResponse.json(
				{ error: `Missing required fields: ${missing.join(", ")}` },
				{ status: 400 }
			);
		}

		// Create booking with AFS
		const afsBooking = await createBooking(body);

		// Create flight reservation record
		const reservation = await prisma.flightReservation.create({
			data: {
				afsBookingId: afsBooking.bookingReference,
				userId: user.id,
				departure: {
					date: new Date(afsBooking.flights[0].departureTime),
					airport: afsBooking.flights[0].origin.code,
				},
				arrival: {
					date: new Date(afsBooking.flights[0].arrivalTime),
					airport: afsBooking.flights[0].destination.code,
				},
				price: afsBooking.flights[0].price,
				status: "CONFIRMED",
			},
		});

		return NextResponse.json(
			{
				message: "Flight booking completed successfully",
				...afsBooking,
				reservationId: reservation.id,
			},
			{ status: 201 }
		);
	} catch (error) {
		return NextResponse.json(
			{ error: error.message || "Booking failed" },
			{ status: error.status || 500 }
		);
	}
}
