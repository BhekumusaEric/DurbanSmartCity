import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { TransactionStatus } from '@prisma/client';

/**
 * GET: Fetch service offerings with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const providerId = url.searchParams.get('providerId');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = {
      isActive: true
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (providerId) {
      where.providerId = providerId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch service offerings
    const serviceOfferings = await prisma.serviceOffering.findMany({
      where,
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
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.serviceOffering.count({ where });

    // Get provider ratings and completed services count
    const enhancedOfferings = await Promise.all(
      serviceOfferings.map(async (offering) => {
        // Count completed transactions for this provider
        const completedServicesCount = await prisma.serviceTransaction.count({
          where: {
            providerId: offering.providerId,
            status: 'COMPLETED' as TransactionStatus
          }
        });

        // Calculate average rating for this provider
        const providerRatings = await prisma.serviceTransaction.findMany({
          where: {
            providerId: offering.providerId,
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
          ...offering,
          provider: {
            ...offering.provider,
            rating: parseFloat(averageRating.toFixed(1)),
            completedServices: completedServicesCount
          }
        };
      })
    );

    return NextResponse.json({
      serviceOfferings: enhancedOfferings,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching service offerings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service offerings' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new service offering
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
    const { title, description, category, price, deliveryTime, features } = body;

    // Validate required fields
    if (!title || !description || !category || !price || !deliveryTime) {
      return NextResponse.json(
        { error: 'Title, description, category, price, and delivery time are required' },
        { status: 400 }
      );
    }

    // Create service offering
    const serviceOffering = await prisma.serviceOffering.create({
      data: {
        title,
        description,
        category,
        price,
        deliveryTime,
        features: Array.isArray(features) ? features.filter(Boolean).join('|') : '',
        isActive: true,
        provider: {
          connect: { id: session.user.id as string }
        }
      }
    });

    return NextResponse.json({
      serviceOffering,
      message: 'Service offering created successfully'
    });
  } catch (error) {
    console.error('Error creating service offering:', error);
    return NextResponse.json(
      { error: 'Failed to create service offering' },
      { status: 500 }
    );
  }
}
