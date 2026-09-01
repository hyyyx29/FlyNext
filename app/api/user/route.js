import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/user
// Fetches the current user's profile.
export async function GET(request) {
  try {
    // Authentication check: verifyToken returns the JWT payload.
    const currentUser = await verifyToken(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract the user identifier from the token payload.
    const userId = currentUser.userId || currentUser.id;
    if (!userId) {
      return NextResponse.json({ error: "User identifier missing in token" }, { status: 400 });
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePic: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// PUT /api/user
// Updates the current user's profile.
export async function PUT(request) {
  try {
    // Authentication check
    const currentUser = await verifyToken(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract the user identifier from the token payload.
    const userId = currentUser.userId || currentUser.id;
    if (!userId) {
      return NextResponse.json({ error: "User identifier missing in token" }, { status: 400 });
    }

    // Get update data from the request body
    const body = await request.json();

    // Validate allowed fields (firstName, lastName, profilePic, phone)
    const allowedFields = ["firstName", "lastName", "profilePic", "phone"];
    const updates = Object.keys(body).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = body[key];
      }
      return acc;
    }, {});

    // Update the user in the database without selecting the 'role' field.
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePic: true,
        phone: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}
