import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { TransactionStatus } from '@prisma/client';

/**
 * POST: Process a payment for a transaction
 *
 * Note: This is a simplified payment endpoint. In a real application,
 * you would integrate with a payment gateway like Stripe, PayFast, or PayPal.
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
    const { transactionId, paymentMethod } = body;

    // Validate required fields
    if (!transactionId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Transaction ID and payment method are required' },
        { status: 400 }
      );
    }

    // Fetch transaction
    const transaction = await prisma.serviceTransaction.findUnique({
      where: { id: transactionId },
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

    // Check if user is the client
    if (transaction.clientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the client can make a payment' },
        { status: 403 }
      );
    }

    // Check if transaction is in the correct state
    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Payment can only be made for pending transactions' },
        { status: 400 }
      );
    }

    // In a real application, you would process the payment with a payment gateway here
    // For this example, we'll simulate a successful payment

    // Update transaction status to IN_PROGRESS
    const updatedTransaction = await prisma.serviceTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'IN_PROGRESS' as TransactionStatus
      }
    });

    // Create a payment record (in a real app, you would store payment details)
    const payment = {
      id: `payment-${Date.now()}`,
      transactionId,
      amount: transaction.amount,
      paymentMethod,
      status: 'COMPLETED',
      date: new Date().toISOString()
    };

    return NextResponse.json({
      transaction: updatedTransaction,
      payment,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
