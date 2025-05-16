import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { RequestStatus, TransactionStatus } from '@prisma/client';

/**
 * GET: Fetch a specific service offering by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Fetch service offering with related data
    const serviceOffering = await prisma.serviceOffering.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            createdAt: true
          }
        }
      }
    });

    if (!serviceOffering) {
      return NextResponse.json(
        { error: 'Service offering not found' },
        { status: 404 }
      );
    }

    // Get provider ratings and completed services count
    const completedServicesCount = await prisma.serviceTransaction.count({
      where: {
        providerId: serviceOffering.providerId,
        status: 'COMPLETED' as TransactionStatus
      }
    });

    // Calculate average rating for this provider
    const providerRatings = await prisma.serviceTransaction.findMany({
      where: {
        providerId: serviceOffering.providerId,
        clientRating: { not: null }
      },
      select: {
        clientRating: true
      }
    });

    const totalRatings = providerRatings.reduce(
      (sum, transaction) => sum + (transaction.clientRating || 0),
      0
    );
    const averageRating = providerRatings.length > 0
      ? totalRatings / providerRatings.length
      : 0;

    // Get reviews for this provider
    const reviews = await prisma.serviceTransaction.findMany({
      where: {
        providerId: serviceOffering.providerId,
        clientRating: { not: null },
        clientReview: { not: null }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 10
    });

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.clientRating,
      comment: review.clientReview,
      createdAt: review.completedAt,
      reviewer: {
        id: review.client.id,
        name: review.client.name,
        image: review.client.image
      }
    }));

    // Parse features from string to array
    const features = serviceOffering.features ?
      serviceOffering.features.split('|').filter(Boolean) :
      [];

    // Format the response
    const formattedOffering = {
      ...serviceOffering,
      features,
      provider: {
        ...serviceOffering.provider,
        rating: parseFloat(averageRating.toFixed(1)),
        completedServices: completedServicesCount,
        joinedDate: serviceOffering.provider.createdAt
      },
      reviews: formattedReviews
    };

    return NextResponse.json(formattedOffering);
  } catch (error) {
    console.error('Error fetching service offering:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service offering' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update a service offering
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const id = params.id;
    const body = await req.json();
    const { title, description, category, price, deliveryTime, features, isActive } = body;

    // Check if service offering exists and belongs to the user
    const existingOffering = await prisma.serviceOffering.findUnique({
      where: { id },
      select: { providerId: true }
    });

    if (!existingOffering) {
      return NextResponse.json(
        { error: 'Service offering not found' },
        { status: 404 }
      );
    }

    if (existingOffering.providerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to update this service offering' },
        { status: 403 }
      );
    }

    // Update service offering
    const updatedOffering = await prisma.serviceOffering.update({
      where: { id },
      data: {
        title,
        description,
        category,
        price,
        deliveryTime,
        features: Array.isArray(features) ? features.filter(Boolean).join('|') : undefined,
        isActive
      }
    });

    return NextResponse.json({
      serviceOffering: updatedOffering,
      message: 'Service offering updated successfully'
    });
  } catch (error) {
    console.error('Error updating service offering:', error);
    return NextResponse.json(
      { error: 'Failed to update service offering' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a service offering
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const id = params.id;

    // Check if service offering exists and belongs to the user
    const existingOffering = await prisma.serviceOffering.findUnique({
      where: { id },
      select: { providerId: true }
    });

    if (!existingOffering) {
      return NextResponse.json(
        { error: 'Service offering not found' },
        { status: 404 }
      );
    }

    if (existingOffering.providerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this service offering' },
        { status: 403 }
      );
    }

    // Delete service offering
    await prisma.serviceOffering.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Service offering deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service offering:', error);
    return NextResponse.json(
      { error: 'Failed to delete service offering' },
      { status: 500 }
    );
  }
}
