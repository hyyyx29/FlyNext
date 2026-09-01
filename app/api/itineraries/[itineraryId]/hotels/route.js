import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// cancel the hotel booking
export async function DELETE(request, { params }) {
	try {
		const currentUser = await verifyToken(request);
		if (!currentUser) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { itineraryId } = params;

		// find the hotel reservation
		const hotelReservation = await prisma.hotelReservation.findUnique({
			where: {
				itineraryId: Number(itineraryId),
				userId: currentUser.userId,
			},
			include: { hotel: true },
		});
		if (!hotelReservation) {
			return NextResponse.json(
				{ error: "Hotel booking not found" },
				{ status: 404 }
			);
		}

		// check the user's identity, must be the booker or the hotel owner
		if (
			currentUser.userId !== hotelReservation.userId &&
			currentUser.userId !== hotelReservation.hotel.ownerId
		) {
			return NextResponse.json(
				{ error: "You do not have permission to cancel this booking" },
				{ status: 403 }
			);
		}

		// cancel the hotel reservation
		await prisma.hotelReservation.update({
			where: { id: hotelReservation.id },
			data: { status: "CANCELLED" },
		});

		// Update the room availablity
		const roomTypeId = hotelReservation.roomTypeId;
		const roomType = await prisma.roomType.findUnique({
			where: { id: Number(roomTypeId) },
		});
		if (!roomType) {
			return NextResponse.json(
				{ error: "Room type not found" },
				{ status: 404 }
			);
		}
		await prisma.roomType.update({
			where: { id: Number(roomTypeId) },
			data: { currentAvailability: { increment: 1 } },
		});

		// Update the itinerary price
		await prisma.itinerary.update({
			where: { id: Number(itineraryId), userId: currentUser.id },
			data: { totalPrice: { decrement: hotelReservation.price } },
		});

		return NextResponse.json({
			message: "Hotel booking cancelled successfully",
		});
	} catch (error) {
		return NextResponse.json(
			{ error: error.message || "Hotel booking cancellation failed" },
			{ status: 500 }
		);
	}
}
