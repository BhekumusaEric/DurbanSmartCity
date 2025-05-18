import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { prisma } from "@/lib/prisma"
import { MessagingInterface } from "@/components/marketplace/messaging-interface"

export const metadata: Metadata = {
  title: "Messages",
  description: "Chat with clients and service providers",
}



export default async function MessagesPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  // Get all conversations for the current user
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { user1Id: session.user.id },
        { user2Id: session.user.id }
      ]
    },
    include: {
      user1: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      user2: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      messages: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  // Format conversations for the UI
  const formattedConversations = conversations.map(conversation => {
    const otherUser = conversation.user1Id === session.user.id
      ? conversation.user2
      : conversation.user1

    return {
      id: conversation.id,
      user: otherUser,
      lastMessage: conversation.messages[0] || null,
      updatedAt: conversation.updatedAt
    }
  })

  // If a specific conversation is requested, check if it exists or needs to be created
  let activeConversation = null
  const withUserId = searchParams.with as string | undefined
  if (withUserId) {
    // Check if the requested user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: withUserId },
      select: {
        id: true,
        name: true,
        image: true
      }
    })

    if (otherUser) {
      // Check if a conversation already exists between these users
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            {
              user1Id: session.user.id,
              user2Id: otherUser.id
            },
            {
              user1Id: otherUser.id,
              user2Id: session.user.id
            }
          ]
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })

      if (existingConversation) {
        activeConversation = {
          id: existingConversation.id,
          user: otherUser,
          messages: existingConversation.messages
        }
      } else {
        // Create a new conversation
        const newConversation = await prisma.conversation.create({
          data: {
            user1Id: session.user.id,
            user2Id: otherUser.id
          }
        })

        activeConversation = {
          id: newConversation.id,
          user: otherUser,
          messages: []
        }
      }
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Messages"
        text="Chat with clients and service providers"
      />
      <div className="grid gap-8">
        <MessagingInterface
          conversations={formattedConversations}
          activeConversation={activeConversation}
          currentUser={{
            id: session.user.id,
            name: session.user.name || "",
            image: session.user.image || ""
          }}
        />
      </div>
    </DashboardShell>
  )
}
