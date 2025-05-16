import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { RequestStatus } from '@prisma/client';

/**
 * GET: Fetch a specific service request by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Fetch service request with related data
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true
          }
        },
        proposals: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    // Get provider ratings and completed services count
    const enhancedProposals = await Promise.all(
      serviceRequest.proposals.map(async (proposal) => {
        // Count completed transactions for this provider
        const completedServicesCount = await prisma.serviceTransaction.count({
          where: {
            providerId: proposal.providerId,
            status: 'COMPLETED'
          }
        });

        // Calculate average rating for this provider
        const providerRatings = await prisma.serviceTransaction.findMany({
          where: {
            providerId: proposal.providerId,
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

        return {
          ...proposal,
          provider: {
            ...proposal.provider,
            rating: parseFloat(averageRating.toFixed(1)),
            completedServices: completedServicesCount
          }
        };
      })
    );

    // Format the response
    const formattedRequest = {
      ...serviceRequest,
      proposals: enhancedProposals
    };

    return NextResponse.json(formattedRequest);
  } catch (error) {
    console.error('Error fetching service request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service request' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update a service request
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
    const { title, description, category, budget, deadline, status } = body;

    // Check if service request exists and belongs to the user
    const existingRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { requestedById: true }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    if (existingRequest.requestedById !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to update this service request' },
        { status: 403 }
      );
    }

    // Update service request
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        title,
        description,
        category,
        budget,
        deadline: deadline ? new Date(deadline) : undefined,
        status: status as RequestStatus
      }
    });

    return NextResponse.json({
      serviceRequest: updatedRequest,
      message: 'Service request updated successfully'
    });
  } catch (error) {
    console.error('Error updating service request:', error);
    return NextResponse.json(
      { error: 'Failed to update service request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a service request
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

    // Check if service request exists and belongs to the user
    const existingRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { requestedById: true }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    if (existingRequest.requestedById !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this service request' },
        { status: 403 }
      );
    }

    // Delete service request (this will cascade delete proposals)
    await prisma.serviceRequest.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Service request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service request:', error);
    return NextResponse.json(
      { error: 'Failed to delete service request' },
      { status: 500 }
    );
  }
}
