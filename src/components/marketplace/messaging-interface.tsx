"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Send, Search } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface User {
  id: string
  name: string
  image: string
}

interface Message {
  id: string
  content: string
  senderId: string
  conversationId: string
  createdAt: string
}

interface Conversation {
  id: string
  user: User
  lastMessage: Message | null
  updatedAt: string
}

interface ActiveConversation {
  id: string
  user: User
  messages: Message[]
}

interface MessagingInterfaceProps {
  conversations: Conversation[]
  activeConversation: ActiveConversation | null
  currentUser: User
}

export function MessagingInterface({
  conversations,
  activeConversation: initialActiveConversation,
  currentUser
}: MessagingInterfaceProps) {
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(initialActiveConversation)
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState(conversations)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Filter conversations based on search query
    if (searchQuery) {
      setFilteredConversations(
        conversations.filter(conversation =>
          conversation.user.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredConversations(conversations)
    }
  }, [searchQuery, conversations])

  useEffect(() => {
    // Scroll to bottom of messages
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [activeConversation?.messages])

  const handleConversationSelect = (conversation: Conversation) => {
    // Update URL to include the selected conversation
    const params = new URLSearchParams(searchParams)
    params.set("with", conversation.user.id)
    router.push(`${pathname}?${params.toString()}`)

    // Fetch the full conversation with all messages
    fetchConversation(conversation.id)
  }

  const fetchConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/marketplace/messages/conversations/${conversationId}`)
      const data = await response.json()

      if (response.ok) {
        const otherUser = data.conversation.user1Id === currentUser.id
          ? data.conversation.user2
          : data.conversation.user1

        setActiveConversation({
          id: data.conversation.id,
          user: otherUser,
          messages: data.conversation.messages
        })
      } else {
        throw new Error(data.error || "Failed to fetch conversation")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!activeConversation || !message.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/marketplace/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          content: message
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Add the new message to the active conversation
        setActiveConversation(prev => {
          if (!prev) return prev

          return {
            ...prev,
            messages: [...prev.messages, data.message]
          }
        })

        // Clear the message input
        setMessage("")
      } else {
        throw new Error(data.error || "Failed to send message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U"
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-3 h-[600px]">
        {/* Conversations List */}
        <div className="border-r">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(600px-65px)]">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    activeConversation?.id === conversation.id ? "bg-muted" : ""
                  }`}
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.user.image} alt={conversation.user.name} />
                      <AvatarFallback>{getInitials(conversation.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conversation.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage.senderId === currentUser.id ? "You: " : ""}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? "No conversations match your search" : "No conversations yet"}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="col-span-2 flex flex-col">
          {activeConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activeConversation.user.image} alt={activeConversation.user.name} />
                  <AvatarFallback>{getInitials(activeConversation.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{activeConversation.user.name}</p>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeConversation.messages.length > 0 ? (
                  activeConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderId === currentUser.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.senderId === currentUser.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button type="submit" size="icon" disabled={isSubmitting || !message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
