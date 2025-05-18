"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Transaction {
  id: string
  status: string
  clientReview?: string
  providerReview?: string
  client: {
    id: string
    name: string
    image?: string
  }
  provider: {
    id: string
    name: string
    image?: string
  }
  completedAt?: string
}

interface TransactionActionsProps {
  transaction: Transaction
  userRole: "client" | "provider"
}

export function TransactionActions({ transaction, userRole }: TransactionActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveryMessage, setDeliveryMessage] = useState("")
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const updateTransactionStatus = async (status: string) => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this transaction?`)) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/marketplace/transactions/${transaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: `Transaction ${status.toLowerCase()} successfully`,
        })
        router.refresh()
      } else {
        throw new Error(data.error || `Failed to ${status.toLowerCase()} transaction`)
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

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!deliveryMessage) {
      toast({
        title: "Error",
        description: "Please provide a delivery message",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, you would upload files to storage here
      // For this demo, we'll just update the transaction status

      const response = await fetch(`/api/marketplace/transactions/${transaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "COMPLETED",
          deliveryMessage,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Delivery submitted successfully",
        })
        setIsDeliveryDialogOpen(false)
        router.refresh()
      } else {
        throw new Error(data.error || "Failed to submit delivery")
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reviewComment) {
      toast({
        title: "Error",
        description: "Please provide a review comment",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/marketplace/transactions/${transaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [userRole === "client" ? "clientRating" : "providerRating"]: reviewRating,
          [userRole === "client" ? "clientReview" : "providerReview"]: reviewComment,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Review submitted successfully",
        })
        setIsReviewDialogOpen(false)
        router.refresh()
      } else {
        throw new Error(data.error || "Failed to submit review")
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

  // Determine which actions to show based on transaction status and user role
  const renderActions = () => {
    const { status } = transaction

    if (status === "PENDING") {
      if (userRole === "client") {
        return (
          <div className="flex space-x-2">
            <Button
              onClick={() => updateTransactionStatus("IN_PROGRESS")}
              disabled={isSubmitting}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Project
            </Button>
            <Button
              variant="outline"
              onClick={() => updateTransactionStatus("CANCELLED")}
              disabled={isSubmitting}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )
      }
      return <p className="text-sm text-muted-foreground">Waiting for client to start the project</p>
    }

    if (status === "IN_PROGRESS") {
      if (userRole === "provider") {
        return (
          <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Submit Delivery
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleDeliverySubmit}>
                <DialogHeader>
                  <DialogTitle>Submit Delivery</DialogTitle>
                  <DialogDescription>
                    Provide details about your delivery and upload any relevant files.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="deliveryMessage">Delivery Message</Label>
                    <Textarea
                      id="deliveryMessage"
                      placeholder="Describe what you're delivering..."
                      value={deliveryMessage}
                      onChange={(e) => setDeliveryMessage(e.target.value)}
                      rows={5}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deliveryFiles">Files (Optional)</Label>
                    <Input
                      id="deliveryFiles"
                      type="file"
                      multiple
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDeliveryDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Delivery"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )
      }
      return (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => updateTransactionStatus("DISPUTED")}
            disabled={isSubmitting}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report Issue
          </Button>
        </div>
      )
    }

    if (status === "COMPLETED") {
      // Check if user has already left a review
      const hasReviewed = userRole === "client"
        ? transaction.clientReview
        : transaction.providerReview

      if (!hasReviewed) {
        return (
          <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <CheckCircle className="mr-2 h-4 w-4" />
                Leave a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleReviewSubmit}>
                <DialogHeader>
                  <DialogTitle>Leave a Review</DialogTitle>
                  <DialogDescription>
                    Share your experience working with {userRole === "client" ? "the provider" : "the client"}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          className={`text-2xl ${
                            rating <= reviewRating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
                          }`}
                          onClick={() => setReviewRating(rating)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reviewComment">Review</Label>
                    <Textarea
                      id="reviewComment"
                      placeholder="Share your experience..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={5}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsReviewDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )
      }
      return <p className="text-sm text-muted-foreground">Transaction completed</p>
    }

    if (status === "CANCELLED") {
      return <p className="text-sm text-muted-foreground">Transaction cancelled</p>
    }

    if (status === "DISPUTED") {
      return <p className="text-sm text-muted-foreground">Transaction is under review by support</p>
    }

    return null
  }

  return (
    <div className="w-full flex justify-center">
      {renderActions()}
    </div>
  )
}
