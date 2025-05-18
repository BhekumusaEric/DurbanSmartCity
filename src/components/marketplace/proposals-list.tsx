"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Star, Clock, Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

interface Provider {
  id: string
  name: string
  image: string
  rating: number
  completedServices: number
}

interface Proposal {
  id: string
  description: string
  price: string
  deliveryTime: string
  status: string
  createdAt: string
  provider: Provider
}

interface ProposalsListProps {
  requestId: string
}

export function ProposalsList({ requestId }: ProposalsListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/marketplace/proposals?requestId=${requestId}`)
      const data = await response.json()

      if (response.ok) {
        setProposals(data.proposals)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch proposals",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [requestId, toast])

  const handleAcceptProposal = async (proposalId: string) => {
    if (!confirm("Are you sure you want to accept this proposal? This will create a service transaction.")) {
      return
    }

    try {
      const response = await fetch(`/api/marketplace/proposals/${proposalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "ACCEPTED",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Proposal accepted successfully",
        })
        fetchProposals()
        router.refresh()
      } else {
        throw new Error(data.error || "Failed to accept proposal")
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleRejectProposal = async (proposalId: string) => {
    if (!confirm("Are you sure you want to reject this proposal?")) {
      return
    }

    try {
      const response = await fetch(`/api/marketplace/proposals/${proposalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REJECTED",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Proposal rejected successfully",
        })
        fetchProposals()
        router.refresh()
      } else {
        throw new Error(data.error || "Failed to reject proposal")
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "ACCEPTED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
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
    <div className="space-y-6">
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-b pb-6 last:border-0 last:pb-0">
                <div className="flex items-center mb-4">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20 ml-auto" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-24" />
                  <div className="space-x-2">
                    <Skeleton className="h-9 w-20 inline-block" />
                    <Skeleton className="h-9 w-20 inline-block" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : proposals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Proposals ({proposals.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="border-b pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={proposal.provider.image} alt={proposal.provider.name} />
                      <AvatarFallback>{getInitials(proposal.provider.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{proposal.provider.name}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        {proposal.provider.rating > 0 && (
                          <div className="flex items-center text-yellow-500 mr-2">
                            <Star className="h-3 w-3 fill-current mr-1" />
                            <span>{proposal.provider.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {proposal.provider.completedServices > 0 && (
                          <span>{proposal.provider.completedServices} completed services</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(proposal.status)}>
                    {proposal.status}
                  </Badge>
                </div>

                <div className="prose dark:prose-invert max-w-none text-sm mb-4">
                  <p>{proposal.description}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="text-sm font-medium">
                      Price: <span className="text-base">${proposal.price}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Delivery: {proposal.deliveryTime}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Submitted {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                    </div>
                  </div>

                  {proposal.status === "PENDING" && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptProposal(proposal.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRejectProposal(proposal.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No proposals yet</h3>
          <p className="text-sm text-muted-foreground">
            Your service request hasn&apos;t received any proposals yet.
          </p>
        </div>
      )}
    </div>
  )
}
