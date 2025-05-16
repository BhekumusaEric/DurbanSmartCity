import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/services/notificationService';
import { TransactionStatus } from '@prisma/client';

/**
 * GET: Fetch a specific transaction by ID
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

    // Fetch transaction with related data
    const transaction = await prisma.serviceTransaction.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
            bio: true
          }
        },
        proposal: {
          include: {
            request: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this transaction
    if (transaction.clientId !== session.user.id &&
        transaction.providerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to view this transaction' },
        { status: 403 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update a transaction's status or add a review
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
    const {
      status,
      clientRating,
      clientReview,
      providerRating,
      providerReview
    } = body;

    // Fetch transaction to check authorization
    const transaction = await prisma.serviceTransaction.findUnique({
      where: { id },
      include: {
        proposal: true
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to update this transaction
    const isClient = transaction.clientId === session.user.id;
    const isProvider = transaction.providerId === session.user.id;

    if (!isClient && !isProvider) {
      return NextResponse.json(
        { error: 'You are not authorized to update this transaction' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Handle status update
    if (status) {
      // Validate status
      if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }

      // Status update permissions
      if (status === 'IN_PROGRESS' && !isClient) {
        return NextResponse.json(
          { error: 'Only the client can start the transaction' },
          { status: 403 }
        );
      }

      if (status === 'COMPLETED' && !isClient) {
        return NextResponse.json(
          { error: 'Only the client can mark the transaction as completed' },
          { status: 403 }
        );
      }

      if (status === 'CANCELLED') {
        // Both client and provider can cancel, but only if not already completed
        if (transaction.status === 'COMPLETED') {
          return NextResponse.json(
            { error: 'Cannot cancel a completed transaction' },
            { status: 400 }
          );
        }
      }

      updateData.status = status as TransactionStatus;

      // If marking as completed, set completedAt
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();

        // Also update the proposal status
        await prisma.serviceProposal.update({
          where: { id: transaction.proposalId },
          data: { status: 'COMPLETED' }
        });
      }
    }

    // Handle reviews and ratings
    if (isClient) {
      if (clientRating !== undefined) {
        if (clientRating < 1 || clientRating > 5) {
          return NextResponse.json(
            { error: 'Rating must be between 1 and 5' },
            { status: 400 }
          );
        }
        updateData.clientRating = clientRating;
      }

      if (clientReview !== undefined) {
        updateData.clientReview = clientReview;
      }
    }

    if (isProvider) {
      if (providerRating !== undefined) {
        if (providerRating < 1 || providerRating > 5) {
          return NextResponse.json(
            { error: 'Rating must be between 1 and 5' },
            { status: 400 }
          );
        }
        updateData.providerRating = providerRating;
      }

      if (providerReview !== undefined) {
        updateData.providerReview = providerReview;
      }
    }

    // Update transaction
    const updatedTransaction = await prisma.serviceTransaction.update({
      where: { id },
      data: updateData,
      include: {
        proposal: {
          include: {
            request: true
          }
        }
      }
    });

    // Create notification for status changes
    if (status) {
      const actor = await prisma.user.findUnique({
        where: { id: session.user.id as string },
        select: { id: true, name: true }
      });

      await notificationService.notifyTransactionStatusChange({
        transactionId: transaction.id,
        status,
        requestTitle: updatedTransaction.proposal.request.title,
        clientId: transaction.clientId,
        providerId: transaction.providerId,
        actorId: session.user.id as string,
        actorName: actor?.name || 'A user'
      });
    }

    // Create notification for reviews
    if (isClient && clientRating !== undefined) {
      await notificationService.notifyNewReview({
        transactionId: transaction.id,
        requestTitle: updatedTransaction.proposal.request.title,
        reviewerId: transaction.clientId,
        reviewerName: session.user?.name || 'The client',
        recipientId: transaction.providerId,
        rating: clientRating
      });
    }

    if (isProvider && providerRating !== undefined) {
      await notificationService.notifyNewReview({
        transactionId: transaction.id,
        requestTitle: updatedTransaction.proposal.request.title,
        reviewerId: transaction.providerId,
        reviewerName: session.user?.name || 'The provider',
        recipientId: transaction.clientId,
        rating: providerRating
      });
    }

    return NextResponse.json({
      transaction: updatedTransaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
