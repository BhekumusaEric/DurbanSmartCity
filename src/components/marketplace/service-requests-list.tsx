"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ServiceCard } from "@/components/marketplace/service-card"
import { AdvancedSearch, SearchFilters } from "@/components/marketplace/advanced-search"
import { useToast } from "@/components/ui/use-toast"

interface ServiceRequest {
  id: string
  title: string
  description: string
  category: string
  budget: string
  deadline: string
  status: string
  requestedBy: {
    id: string
    name: string
    image: string
  }
  proposalsCount: number
}

interface ServiceRequestsListProps {
  userId?: string
  isOwner?: boolean
}



const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export function ServiceRequestsList({ userId, isOwner = false }: ServiceRequestsListProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<SearchFilters & { status?: string }>({
    query: "",
    category: "all",
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc"
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      let url = `/api/marketplace/service-requests?page=${page}&limit=9`

      if (filters.query) {
        url += `&search=${encodeURIComponent(filters.query)}`
      }

      if (filters.category !== "all") {
        url += `&category=${encodeURIComponent(filters.category)}`
      }

      if (filters.status && filters.status !== "all") {
        url += `&status=${encodeURIComponent(filters.status)}`
      }

      if (filters.minPrice) {
        url += `&minBudget=${encodeURIComponent(filters.minPrice)}`
      }

      if (filters.maxPrice) {
        url += `&maxBudget=${encodeURIComponent(filters.maxPrice)}`
      }

      if (filters.sortBy) {
        url += `&sortBy=${encodeURIComponent(filters.sortBy)}`
      }

      if (filters.sortOrder) {
        url += `&sortOrder=${encodeURIComponent(filters.sortOrder)}`
      }

      if (userId) {
        url += `&requestedById=${encodeURIComponent(userId)}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setRequests(data.serviceRequests)
        setTotalPages(data.pagination.pages)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch service requests",
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
  }, [userId, filters, page, toast])

  const handleSearch = (newFilters: SearchFilters) => {
    // Preserve the status filter which is specific to requests
    setFilters(prev => ({ ...newFilters, status: prev.status }))
    setPage(1) // Reset to first page on new search
  }

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status }))
    setPage(1) // Reset to first page on status change
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <AdvancedSearch
          onSearch={handleSearch}
          initialFilters={filters}
        />
        <div className="w-full">
          <select
            className="w-full p-2 border rounded-md bg-background"
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : requests.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <ServiceCard
                key={request.id}
                service={request}
                isOwner={isOwner}
                type="request"
              />
            ))}
          </div>

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
        </>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No requests found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {isOwner
              ? "You haven't created any service requests yet."
              : "No service requests match your search criteria."}
          </p>
        </div>
      )}
    </div>
  )
}
