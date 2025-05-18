"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ServiceCard } from "@/components/marketplace/service-card"
import { AdvancedSearch, SearchFilters } from "@/components/marketplace/advanced-search"
import { useToast } from "@/components/ui/use-toast"

interface ServiceOffering {
  id: string
  title: string
  description: string
  category: string
  price: string
  deliveryTime: string
  features: string[]
  provider: {
    id: string
    name: string
    image: string
    rating: number
    completedServices: number
  }
}

interface ServiceOfferingsListProps {
  userId?: string
  isOwner?: boolean
}



export function ServiceOfferingsList({ userId, isOwner = false }: ServiceOfferingsListProps) {
  const [offerings, setOfferings] = useState<ServiceOffering[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "all",
    sortBy: "createdAt",
    sortOrder: "desc"
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    fetchOfferings()
  }, [userId, isOwner, filters, page, fetchOfferings])

  const fetchOfferings = useCallback(async () => {
    try {
      setLoading(true)
      let url = `/api/marketplace/service-offerings?page=${page}&limit=9`

      if (filters.query) {
        url += `&search=${encodeURIComponent(filters.query)}`
      }

      if (filters.category !== "all") {
        url += `&category=${encodeURIComponent(filters.category)}`
      }

      if (filters.minPrice) {
        url += `&minPrice=${encodeURIComponent(filters.minPrice)}`
      }

      if (filters.maxPrice) {
        url += `&maxPrice=${encodeURIComponent(filters.maxPrice)}`
      }

      if (filters.rating && filters.rating > 0) {
        url += `&minRating=${encodeURIComponent(filters.rating.toString())}`
      }

      if (filters.deliveryTime && filters.deliveryTime !== "any") {
        url += `&maxDeliveryDays=${encodeURIComponent(filters.deliveryTime)}`
      }

      if (filters.sortBy) {
        url += `&sortBy=${encodeURIComponent(filters.sortBy)}`
      }

      if (filters.sortOrder) {
        url += `&sortOrder=${encodeURIComponent(filters.sortOrder)}`
      }

      if (userId) {
        url += `&providerId=${encodeURIComponent(userId)}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setOfferings(data.serviceOfferings)
        setTotalPages(data.pagination.pages)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch service offerings",
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
    setFilters(newFilters)
    setPage(1) // Reset to first page on new search
  }

  return (
    <div className="space-y-6">
      <AdvancedSearch
        onSearch={handleSearch}
        initialFilters={filters}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="h-40 w-full" />
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
      ) : offerings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map((offering) => (
              <ServiceCard
                key={offering.id}
                service={offering}
                isOwner={isOwner}
                type="offering"
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
          <h3 className="text-lg font-medium mb-2">No services found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {isOwner
              ? "You haven't created any service offerings yet."
              : "No service offerings match your search criteria."}
          </p>
        </div>
      )}
    </div>
  )
}
