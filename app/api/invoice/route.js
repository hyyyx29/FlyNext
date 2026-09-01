import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import PDFDocument from 'pdfkit';

export async function GET(req) {
  try {
    // Authenticate the user
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract itineraryId from the query parameters
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itineraryId');
    if (!itineraryId) {
      return NextResponse.json({ error: 'Missing itineraryId' }, { status: 400 });
    }

    // Retrieve the itinerary from the database and ensure it belongs to the user
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: parseInt(itineraryId, 10) },
      include: {
        flight: true,
        hotel: true,
      },
    });
    if (!itinerary) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }
    if (itinerary.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    // Create a new PDF document using PDFKit
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // Set up the document content
    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Booking Date: ${new Date(itinerary.bookingDate).toLocaleString()}`);
    doc.text(`Total Price: $${itinerary.totalPrice.toFixed(2)}`);
    doc.text(`Status: ${itinerary.status}`);
    doc.moveDown();
    doc.text('Payment Info:');
    doc.text(`Card (Last 4): ${itinerary.cardNumber}`);
    doc.text(`Card Expiry: ${itinerary.cardExpiry}`);
    doc.moveDown();
    // Since 'flight' and 'hotel' are optional objects, indicate whether they exist
    doc.text(`Flight Reservation: ${itinerary.flight ? 'Yes' : 'No'}`);
    doc.text(`Hotel Reservation: ${itinerary.hotel ? 'Yes' : 'No'}`);

    doc.end();

    // Convert the PDF document into a Buffer
    const pdfBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Return the PDF as an attachment
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=invoice.pdf',
      },
    });
  } catch (error) {
    console.error('Invoice Generation Error:', error);
    return NextResponse.json({ error: 'Invoice generation failed, please try again later.' }, { status: 500 });
  }
}
