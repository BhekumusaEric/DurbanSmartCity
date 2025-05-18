"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Clock, Edit, Trash, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface ServiceOffering {
  id: string
  title: string
  description: string
  category: string
  price: string
  deliveryTime: string
  provider: {
    id: string
    name: string
    image: string
    rating: number
    completedServices: number
  }
}

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

interface ServiceCardProps {
  service: ServiceOffering | ServiceRequest
  isOwner: boolean
  type: "offering" | "request"
}

export function ServiceCard({ service, isOwner, type }: ServiceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this?")) {
      return
    }

    setIsDeleting(true)
    try {
      const endpoint = type === "offering"
        ? `/api/marketplace/service-offerings/${service.id}`
        : `/api/marketplace/service-requests/${service.id}`

      const response = await fetch(endpoint, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${type === "offering" ? "Service offering" : "Service request"} deleted successfully`,
        })
        router.refresh()
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "No deadline"
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  if (type === "offering") {
    return (
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                {service.category}
              </Badge>
              {service.provider.rating > 0 && (
                <div className="flex items-center text-amber-500">
                  <Star className="h-4 w-4 fill-current mr-1" />
                  <span className="text-sm font-medium">{service.provider.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <Link href={`/dashboard/marketplace/offerings/${service.id}`} className="block group">
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {service.title}
              </h3>
            </Link>

            <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
              {service.description}
            </p>

            <div className="flex items-center mb-4">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={service.provider.image} alt={service.provider.name} />
                <AvatarFallback>{getInitials(service.provider.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{service.provider.name}</p>
                {service.provider.completedServices > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {service.provider.completedServices} completed services
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>Delivery: {service.deliveryTime}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t bg-muted/50 px-6 py-4 flex justify-between">
          <div className="font-semibold">${service.price}</div>

          {isOwner ? (
            <div className="flex space-x-2">
              <Link href={`/dashboard/marketplace/offerings/${service.id}/edit`}>
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          ) : (
            <Link href={`/dashboard/marketplace/offerings/${service.id}`}>
              <Button size="sm">View Details</Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    )
  } else {
    // Service Request Card
    return (
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                {service.category}
              </Badge>
              <Badge className={getStatusColor(service.status)}>
                {service.status.replace("_", " ")}
              </Badge>
            </div>

            <Link href={`/dashboard/marketplace/requests/${service.id}`} className="block group">
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {service.title}
              </h3>
            </Link>

            <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
              {service.description}
            </p>

            <div className="flex items-center mb-4">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={service.requestedBy.image} alt={service.requestedBy.name} />
                <AvatarFallback>{getInitials(service.requestedBy.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{service.requestedBy.name}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(service.deadline)}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{service.proposalsCount || 0} proposals</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t bg-muted/50 px-6 py-4 flex justify-between">
          <div className="font-semibold">
            {service.budget ? `Budget: $${service.budget}` : "No budget specified"}
          </div>

          {isOwner ? (
            <div className="flex space-x-2">
              <Link href={`/dashboard/marketplace/requests/${service.id}/edit`}>
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          ) : (
            <Link href={`/dashboard/marketplace/requests/${service.id}`}>
              <Button size="sm">View Details</Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    )
  }
}
