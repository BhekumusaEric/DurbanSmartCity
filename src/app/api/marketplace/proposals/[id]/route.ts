import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/services/notificationService';
import { Prisma } from '@prisma/client';

type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
type RequestStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type TransactionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

interface ServiceProposal {
  id: string;
  description: string;
  price: string;
  deliveryTime: string;
  status: ProposalStatus;
  requestId: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
  request: {
    requestedById: string;
    status: RequestStatus;
    title: string;
  };
  transaction?: {
    id: string;
    status: TransactionStatus;
  } | null;
}

/**
 * GET: Fetch a specific proposal by ID
 */
export async function GET(
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

    // Fetch proposal with related data
    const proposal = await prisma.serviceProposal.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            requestedBy: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true
          }
        },
        transaction: true
      }
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this proposal
    if (proposal.providerId !== session.user.id &&
        proposal.request.requestedById !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to view this proposal' },
        { status: 403 }
      );
    }

    // Get provider ratings and completed services count
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

    // Format the response
    const formattedProposal = {
      ...proposal,
      provider: {
        ...proposal.provider,
        rating: parseFloat(averageRating.toFixed(1)),
        completedServices: completedServicesCount
      }
    };

    return NextResponse.json(formattedProposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update a proposal's status
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
    const { status } = body;

    // Validate status
    if (!status || !['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

    // Fetch proposal to check authorization
    const proposal = await prisma.serviceProposal.findUnique({
      where: { id },
      include: {
        request: {
          select: {
            requestedById: true,
            status: true,
            title: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true
          }
        },
        transaction: true
      }
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to update this proposal
    const isRequestOwner = proposal.request.requestedById === session.user.id;
    const isProvider = proposal.providerId === session.user.id;

    if (!isRequestOwner && !isProvider) {
      return NextResponse.json(
        { error: 'You are not authorized to update this proposal' },
        { status: 403 }
      );
    }

    // Only request owner can accept/reject proposals
    if ((status === 'ACCEPTED' || status === 'REJECTED') && !isRequestOwner) {
      return NextResponse.json(
        { error: 'Only the service request owner can accept or reject proposals' },
        { status: 403 }
      );
    }

    // Only provider can mark as completed
    if (status === 'COMPLETED' && !isProvider) {
      return NextResponse.json(
        { error: 'Only the service provider can mark a proposal as completed' },
        { status: 403 }
      );
    }

    // If accepting a proposal, create a transaction and update request status
    if (status === 'ACCEPTED') {
      // Get user info for notifications
      const client = await prisma.user.findUnique({
        where: { id: proposal.request.requestedById },
        select: { id: true, name: true }
      });

      const provider = await prisma.user.findUnique({
        where: { id: proposal.providerId },
        select: { id: true, name: true }
      });

      // Start a transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Update proposal status
        const updatedProposal = await tx.serviceProposal.update({
          where: { id },
          data: { status: status as ProposalStatus }
        });

        // Create a service transaction
        const transaction = await tx.serviceTransaction.create({
          data: {
            amount: proposal.price,
            status: 'PENDING' as TransactionStatus,
            client: {
              connect: { id: proposal.request.requestedById }
            },
            provider: {
              connect: { id: proposal.providerId }
            },
            proposal: {
              connect: { id: proposal.id }
            }
          }
        });

        // Update service request status to IN_PROGRESS
        await tx.serviceRequest.update({
          where: { id: proposal.requestId },
          data: { status: 'IN_PROGRESS' as RequestStatus }
        });

        // Reject all other proposals for this request
        await tx.serviceProposal.updateMany({
          where: {
            requestId: proposal.requestId,
            id: { not: proposal.id },
            status: 'PENDING'
          },
          data: { status: 'REJECTED' as ProposalStatus }
        });

        return { updatedProposal, transaction };
      });

      // Create notification for the provider
      await notificationService.notifyProposalAccepted({
        requestId: proposal.requestId,
        requestTitle: proposal.request.title,
        proposalId: proposal.id,
        clientId: client?.id || proposal.request.requestedById,
        clientName: client?.name || 'The client',
        providerId: proposal.providerId
      });

      return NextResponse.json(result);
    } else {
      // Get user info for notifications
      const client = await prisma.user.findUnique({
        where: { id: proposal.request.requestedById },
        select: { id: true, name: true }
      });

      const provider = await prisma.user.findUnique({
        where: { id: proposal.providerId },
        select: { id: true, name: true }
      });

      // For other status updates, just update the proposal
      const updatedProposal = await prisma.serviceProposal.update({
        where: { id },
        data: { status: status as ProposalStatus }
      });

      // If marking as completed, also update the transaction
      if (status === 'COMPLETED' && proposal.transaction) {
        await prisma.serviceTransaction.update({
          where: { proposalId: proposal.id },
          data: {
            status: 'COMPLETED' as TransactionStatus,
            completedAt: new Date()
          }
        });

        // Also update the service request status
        await prisma.serviceRequest.update({
          where: { id: proposal.requestId },
          data: { status: 'COMPLETED' as RequestStatus }
        });
      }

      // Create notification for rejected proposals
      if (status === 'REJECTED') {
        await notificationService.notifyProposalRejected({
          requestId: proposal.requestId,
          requestTitle: proposal.request.title,
          proposalId: proposal.id,
          clientId: client?.id || proposal.request.requestedById,
          clientName: client?.name || 'The client',
          providerId: provider?.id || proposal.providerId
        });
      }

      // If marking as completed, notify about transaction status change
      if (status === 'COMPLETED' && proposal.transaction) {
        const actor = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true }
        });

        await notificationService.notifyTransactionStatusChange({
          transactionId: proposal.transaction.id,
          status: 'COMPLETED',
          requestTitle: proposal.request.title,
          clientId: proposal.request.requestedById,
          providerId: proposal.providerId,
          actorId: session.user.id,
          actorName: actor?.name || 'The provider'
        });
      }

      return NextResponse.json(updatedProposal);
    }
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to update proposal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a proposal
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

    // Fetch proposal to check authorization
    const proposal = await prisma.serviceProposal.findUnique({
      where: { id },
      include: {
        transaction: true
      }
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Only the provider can delete their own proposal
    if (proposal.providerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this proposal' },
        { status: 403 }
      );
    }

    // Cannot delete if proposal is accepted or has a transaction
    if (proposal.status === 'ACCEPTED' || proposal.transaction) {
      return NextResponse.json(
        { error: 'Cannot delete an accepted proposal or one with an active transaction' },
        { status: 400 }
      );
    }

    // Delete proposal
    await prisma.serviceProposal.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Proposal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to delete proposal' },
      { status: 500 }
    );
  }
}
