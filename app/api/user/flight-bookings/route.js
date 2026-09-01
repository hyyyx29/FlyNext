import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request) {
	try {
		const currentUser = await verifyToken(request);
		if (!currentUser) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const bookings = await prisma.flightReservation.findMany({
			where: { userId: currentUser.id },
			select: {
				id: true,
				afsBookingId: true,
				departure: true,
				arrival: true,
				price: true,
				status: true,
				createdAt: true,
			},
			orderBy: { departure: { date: "desc" } },
		});

		return NextResponse.json({
			bookings: bookings.map((b) => ({
				id: b.id,
				status: b.status,
				afsBookingId: b.afsBookingId,
				price: b.price,
				departure: {
					date: b.departure.date,
					airport: b.departure.airport,
				},
				arrival: {
					date: b.arrival.date,
					airport: b.arrival.airport,
				},
				createdAt: b.createdAt,
			})),
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch flight bookings" },
			{ status: 500 }
		);
	}
}
