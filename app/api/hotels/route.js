// app/api/hotels/route.js
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/hotels: get the list of owned hotels with given filter keywords
export async function GET(request) {
  try {
    // get the filter keyword from the request.url
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");  // location
    const name = searchParams.get("name");
    const starRating = searchParams.get("starRating");
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");

    // set up the filter conditions
    const filters = {};
    if (city) {
      filters.location = { contains: city };
    }
    if (name) {
      filters.name = { contains: name };
    }
    if (starRating) {
      filters.starRating = Number(starRating);
    }
    if (priceMin || priceMax) {
      filters.pricePerNight = {};
      if (priceMin) filters.pricePerNight.gte = Number(priceMin);
      if (priceMax) filters.pricePerNight.lte = Number(priceMax);
    }

    // get the list of hotels and return
    const hotels = await prisma.hotel.findMany({
      where: filters,
      include: { roomTypes: true },
    });

    return new Response(JSON.stringify( {hotels: hotels} ), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST /api/hotels: create a new hotel
export async function POST(request) {

  // verify user's login status
  const payload = await verifyToken(request);
  if (!payload) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { name, logo, address, location, starRating, images } = body;

    // verify required fields
    if (!name || !address) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // create the hotel from the given information
    const hotel = await prisma.hotel.create({
      data: {
        name: name,
        logo: logo || null,
        address: address,
        location: location,
        starRating: starRating ? parseFloat(starRating) : null,
        images: images || [],
        ownerId: payload.userId,
      },
    });

    // update the user's information
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (user && !user.IsHotelOwner) {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { IsHotelOwner: true },
      });
    }
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        hotels: {
          connect: { id: hotel.id },
        },
      },
    });

    return new Response(
      JSON.stringify( {message: "Created successfully"} ),
      { status: 201, headers: { "Content-Type": "application/json" },}
    );
  } catch (error) {
    console.error("Error creating hotel:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
