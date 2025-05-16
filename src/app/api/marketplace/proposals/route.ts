import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/services/notificationService';

type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

interface ServiceProposal {
  id: string;
  requestId: string;
  providerId: string;
  description: string;
  price: string;
  deliveryTime: string;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
  request: {
    id: string;
    title: string;
    requestedById: string;
  };
  provider: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface EnhancedProvider {
  id: string;
  name: string | null;
  image: string | null;
  rating: number;
  completedServices: number;
}

interface EnhancedProposal extends Omit<ServiceProposal, 'provider'> {
  provider: EnhancedProvider;
}

/**
 * GET: Fetch proposals with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const requestId = url.searchParams.get('requestId');
    const providerId = url.searchParams.get('providerId');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: {
      requestId?: string;
      providerId?: string;
      status?: ProposalStatus;
    } = {};

    if (requestId) {
      where.requestId = requestId;
    }

    if (providerId) {
      where.providerId = providerId;
    }

    if (status && status !== 'all') {
      where.status = status as ProposalStatus;
    }

    // Fetch proposals
    const proposals = await prisma.serviceProposal.findMany({
      where,
      include: {
        request: {
          select: {
            id: true,
            title: true,
            requestedById: true
          }
        },
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
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.serviceProposal.count({ where });

    // Filter proposals based on user role
    const filteredProposals = proposals.filter((proposal: ServiceProposal) => {
      // User can see proposals if they are the provider or the request owner
      return proposal.providerId === session.user.id ||
             proposal.request.requestedById === session.user.id;
    });

    // Get provider ratings and completed services count
    const enhancedProposals = await Promise.all(
      filteredProposals.map(async (proposal: ServiceProposal) => {
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
          (sum: number, transaction: { clientRating: number | null }) => 
            sum + (transaction.clientRating || 0),
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
        } as EnhancedProposal;
      })
    );

    return NextResponse.json({
      proposals: enhancedProposals,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new proposal
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { requestId, description, price, deliveryTime } = body;

    // Validate required fields
    if (!requestId || !description || !price || !deliveryTime) {
      return NextResponse.json(
        { error: 'Request ID, description, price, and delivery time are required' },
        { status: 400 }
      );
    }

    // Check if service request exists and is open
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        requestedById: true
      }
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    if (serviceRequest.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'This service request is no longer accepting proposals' },
        { status: 400 }
      );
    }

    // Check if user is not the request owner
    if (serviceRequest.requestedById === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot submit a proposal to your own service request' },
        { status: 400 }
      );
    }

    // Check if user has already submitted a proposal for this request
    const existingProposal = await prisma.serviceProposal.findFirst({
      where: {
        requestId,
        providerId: session.user.id as string
      }
    });

    if (existingProposal) {
      return NextResponse.json(
        { error: 'You have already submitted a proposal for this service request' },
        { status: 400 }
      );
    }

    // Create proposal
    const proposal = await prisma.serviceProposal.create({
      data: {
        description,
        price,
        deliveryTime,
        status: 'PENDING' as ProposalStatus,
        request: {
          connect: { id: requestId }
        },
        provider: {
          connect: { id: session.user.id as string }
        }
      },
      include: {
        request: {
          include: {
            requestedBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        provider: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create notification for the request owner
    await notificationService.notifyNewProposal({
      requestId,
      requestTitle: proposal.request.title,
      proposalId: proposal.id,
      providerId: proposal.provider.id,
      providerName: proposal.provider.name || 'A service provider',
      clientId: proposal.request.requestedBy.id
    });

    return NextResponse.json({
      proposal,
      message: 'Proposal submitted successfully'
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to submit proposal' },
      { status: 500 }
    );
  }
}
