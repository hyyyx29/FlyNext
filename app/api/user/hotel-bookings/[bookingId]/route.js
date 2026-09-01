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
		const booking = await prisma.hotelReservation.findUnique({
			where: {
				id: parseInt(bookingId),
				userId: currentUser.id,
			},
			include: {
				hotel: {
					select: {
						name: true,
						address: true,
						location: true,
					},
				},
				roomType: {
					select: {
						name: true,
						amenities: true,
					},
				},
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
				id: booking.id,
				status: booking.status,
				checkIn: booking.checkIn,
				checkOut: booking.checkOut,
				price: booking.price,
				hotel: {
					name: booking.hotel.name,
					address: booking.hotel.address,
					location: booking.hotel.location,
				},
				room: {
					type: booking.roomType.name,
					amenities: booking.roomType.amenities,
				},
				createdAt: booking.createdAt,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch hotel booking details" },
			{ status: 500 }
		);
	}
}
