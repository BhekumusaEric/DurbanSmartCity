"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface NotificationData {
  requestId?: string
  proposalId?: string
  transactionId?: string
  senderId?: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  data: NotificationData
  createdAt: string
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotifications()

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=10")
      const data = await response.json()

      if (response.ok) {
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRead: true }),
      })

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
      })

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
        toast({
          title: "Success",
          description: "All notifications marked as read",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_PROPOSAL":
        return "💼"
      case "PROPOSAL_ACCEPTED":
        return "✅"
      case "PROPOSAL_REJECTED":
        return "❌"
      case "TRANSACTION_STARTED":
        return "🚀"
      case "TRANSACTION_COMPLETED":
        return "🎉"
      case "TRANSACTION_CANCELLED":
        return "🛑"
      case "NEW_MESSAGE":
        return "💬"
      case "NEW_REVIEW":
        return "⭐"
      default:
        return "📣"
    }
  }

  const getNotificationLink = (notification: Notification) => {
    const { type, data } = notification

    switch (type) {
      case "NEW_PROPOSAL":
        return `/dashboard/marketplace/requests/${data.requestId}/proposals`
      case "PROPOSAL_ACCEPTED":
      case "PROPOSAL_REJECTED":
        return `/dashboard/marketplace/proposals/${data.proposalId}`
      case "TRANSACTION_STARTED":
      case "TRANSACTION_COMPLETED":
      case "TRANSACTION_CANCELLED":
        return `/dashboard/marketplace/transactions/${data.transactionId}`
      case "NEW_MESSAGE":
        return `/dashboard/marketplace/messages?with=${data.senderId}`
      case "NEW_REVIEW":
        return `/dashboard/marketplace/transactions/${data.transactionId}`
      default:
        return "/dashboard/marketplace"
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground"
              variant="default"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => handleNotificationClick(notification)}
              >
                <DropdownMenuItem className="cursor-pointer p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-muted">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className={`text-sm font-medium ${!notification.isRead ? "text-primary" : ""}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary"></div>
                  )}
                </DropdownMenuItem>
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notifications" className="cursor-pointer justify-center">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
