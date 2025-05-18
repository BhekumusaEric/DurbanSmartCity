import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { RequestStatus } from '@prisma/client';

/**
 * GET: Fetch service requests with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const userId = url.searchParams.get('userId');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: {
      category?: string;
      status?: string;
      requestedById?: string;
      OR?: Array<{
        title: { contains: string; mode: 'insensitive' };
      } | {
        description: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (userId) {
      where.requestedById = userId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch service requests with count of proposals
    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        proposals: {
          select: {
            id: true
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
    const totalCount = await prisma.serviceRequest.count({ where });

    // Format the response
    const formattedRequests = serviceRequests.map(request => ({
      id: request.id,
      title: request.title,
      description: request.description,
      category: request.category,
      budget: request.budget,
      deadline: request.deadline,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      requestedBy: request.requestedBy,
      proposalCount: request.proposals.length
    }));

    return NextResponse.json({
      serviceRequests: formattedRequests,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service requests' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new service request
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
    const { title, description, category, budget, deadline } = body;

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      );
    }

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        title,
        description,
        category,
        budget,
        deadline: deadline ? new Date(deadline) : null,
        status: 'OPEN' as RequestStatus,
        requestedBy: {
          connect: { id: session.user.id as string }
        }
      }
    });

    return NextResponse.json({
      serviceRequest,
      message: 'Service request created successfully'
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    return NextResponse.json(
      { error: 'Failed to create service request' },
      { status: 500 }
    );
  }
}
