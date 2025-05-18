import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET: Fetch transactions with optional filtering
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
    const status = url.searchParams.get('status');
    const role = url.searchParams.get('role'); // 'client' or 'provider'
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: {
      clientId?: string;
      providerId?: string;
      status?: string;
      OR?: Array<{
        clientId: string;
      } | {
        providerId: string;
      }>;
    } = {};

    // Filter by user role
    if (role === 'client') {
      where.clientId = session.user.id;
    } else if (role === 'provider') {
      where.providerId = session.user.id;
    } else {
      // If no role specified, show transactions where user is either client or provider
      where.OR = [
        { clientId: session.user.id },
        { providerId: session.user.id }
      ];
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Fetch transactions
    const transactions = await prisma.serviceTransaction.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        proposal: {
          include: {
            request: {
              select: {
                id: true,
                title: true
              }
            }
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
    const totalCount = await prisma.serviceTransaction.count({ where });

    return NextResponse.json({
      transactions,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
