import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/services/notificationService';

/**
 * POST: Send a new message
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
    const { conversationId, content } = body;

    // Validate required fields
    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'Conversation ID and content are required' },
        { status: 400 }
      );
    }

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: {
          select: {
            id: true,
            name: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.user1Id !== session.user.id && conversation.user2Id !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        sender: {
          connect: { id: session.user.id }
        },
        conversation: {
          connect: { id: conversationId }
        }
      }
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Determine recipient for notification
    const recipientId = conversation.user1Id === session.user.id
      ? conversation.user2Id
      : conversation.user1Id;



    const senderName = conversation.user1Id === session.user.id
      ? conversation.user1.name
      : conversation.user2.name;

    // Create notification for recipient
    await notificationService.createNotification({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      title: 'New Message',
      message: `You have a new message from ${senderName}`,
      data: {
        conversationId,
        senderId: session.user.id
      }
    });

    return NextResponse.json({
      message,
      success: true
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
