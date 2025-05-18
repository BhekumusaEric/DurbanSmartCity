"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import FilterPanel from "@/components/marketplace/FilterPanel"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Transaction {
  id: string
  amount: string
  status: string
  createdAt: string
  completedAt: string | null
  client: {
    id: string
    name: string
    image: string
  }
  provider: {
    id: string
    name: string
    image: string
  }
  proposal: {
    request: {
      id: string
      title: string
    }
  }
}

interface TransactionsListProps {
  userId: string
  role: "all" | "client" | "provider"
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "DISPUTED", label: "Disputed" },
]

export function TransactionsList({ userId, role }: TransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      let url = `/api/marketplace/transactions?page=${page}&limit=10`

      if (status !== "all") {
        url += `&status=${encodeURIComponent(status)}`
      }

      if (role === "client") {
        url += `&clientId=${encodeURIComponent(userId)}`
      } else if (role === "provider") {
        url += `&providerId=${encodeURIComponent(userId)}`
      } else {
        url += `&userId=${encodeURIComponent(userId)}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setTransactions(data.transactions)
        setTotalPages(data.pagination.pages)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch transactions",
          variant: "destructive",
        })
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [userId, role, status, page, toast])

  const handleStatusChange = (value: string) => {
    setStatus(value)
    setPage(1) // Reset to first page on status change
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "DISPUTED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
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
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-1/3">
          <FilterPanel
            title="Status"
            options={statusOptions}
            selectedValue={status}
            onChange={handleStatusChange}
          />
        </div>
      </div>

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
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : transactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border-b pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage
                        src={role === "provider" ? transaction.client.image : transaction.provider.image}
                        alt={role === "provider" ? transaction.client.name : transaction.provider.name}
                      />
                      <AvatarFallback>
                        {getInitials(role === "provider" ? transaction.client.name : transaction.provider.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {role === "provider" ? transaction.client.name : transaction.provider.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {role === "provider" ? "Client" : "Provider"}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status.replace("_", " ")}
                  </Badge>
                </div>

                <h3 className="text-lg font-medium mb-2">
                  {transaction.proposal.request.title}
                </h3>

                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="text-sm font-medium">
                      Amount: <span className="text-base">${transaction.amount}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                    </div>
                    {transaction.completedAt && (
                      <div className="text-xs text-muted-foreground">
                        Completed {formatDistanceToNow(new Date(transaction.completedAt), { addSuffix: true })}
                      </div>
                    )}
                  </div>

                  <Link href={`/dashboard/marketplace/transactions/${transaction.id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No transactions found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            You don&apos;t have any transactions matching the selected filters.
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
