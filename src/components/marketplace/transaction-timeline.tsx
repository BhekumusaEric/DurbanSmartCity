"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Play,
  Download
} from "lucide-react"
import { format } from "date-fns"

interface Transaction {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  deliveryMessage?: string
}

interface TransactionTimelineProps {
  transaction: Transaction
}

export function TransactionTimeline({ transaction }: TransactionTimelineProps) {
  // Generate timeline events based on transaction data
  const generateTimelineEvents = () => {
    const events = [
      {
        id: "created",
        title: "Transaction Created",
        description: "The service transaction was created",
        icon: <Clock className="h-5 w-5 text-blue-500" />,
        date: new Date(transaction.createdAt),
        status: "completed"
      }
    ]

    // Add status change events based on transaction history
    // In a real app, you would fetch this from a transaction history table
    // For this demo, we'll simulate based on the current status

    if (["IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED"].includes(transaction.status)) {
      events.push({
        id: "started",
        title: "Project Started",
        description: "The client started the project",
        icon: <Play className="h-5 w-5 text-green-500" />,
        date: new Date(new Date(transaction.createdAt).getTime() + 1000 * 60 * 60), // 1 hour after creation
        status: "completed"
      })
    }

    if (["COMPLETED", "DISPUTED"].includes(transaction.status)) {
      events.push({
        id: "delivered",
        title: "Delivery Submitted",
        description: "The provider submitted the delivery",
        icon: <Download className="h-5 w-5 text-indigo-500" />,
        date: transaction.completedAt
          ? new Date(new Date(transaction.completedAt).getTime() - 1000 * 60 * 60) // 1 hour before completion
          : new Date(new Date(transaction.createdAt).getTime() + 1000 * 60 * 60 * 24), // 1 day after creation
        status: "completed"
      })
    }

    if (transaction.status === "COMPLETED") {
      events.push({
        id: "completed",
        title: "Project Completed",
        description: "The project was marked as completed",
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        date: transaction.completedAt ? new Date(transaction.completedAt) : new Date(),
        status: "completed"
      })
    }

    if (transaction.status === "CANCELLED") {
      events.push({
        id: "cancelled",
        title: "Project Cancelled",
        description: "The project was cancelled",
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        date: new Date(new Date(transaction.updatedAt).getTime()),
        status: "completed"
      })
    }

    if (transaction.status === "DISPUTED") {
      events.push({
        id: "disputed",
        title: "Dispute Raised",
        description: "A dispute was raised for this transaction",
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        date: new Date(new Date(transaction.updatedAt).getTime()),
        status: "completed"
      })
    }

    // Sort events by date
    return events.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  const timelineEvents = generateTimelineEvents()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border"></div>

          <div className="space-y-6">
            {timelineEvents.map((event) => (
              <div key={event.id} className="relative flex items-start">
                <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-border z-10">
                  {event.icon}
                </div>

                <div className="ml-16">
                  <div className="flex items-center">
                    <h4 className="text-base font-medium">{event.title}</h4>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {format(event.date, "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </p>

                  {event.id === "delivered" && (
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">Delivery Message:</p>
                      <p className="text-sm">
                        {transaction.deliveryMessage || "The provider has completed the work as requested. Please review and accept the delivery."}
                      </p>

                      {/* In a real app, you would show downloadable files here */}
                      <div className="mt-2">
                        <button className="text-sm text-primary flex items-center">
                          <Download className="h-4 w-4 mr-1" />
                          Download Files
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
