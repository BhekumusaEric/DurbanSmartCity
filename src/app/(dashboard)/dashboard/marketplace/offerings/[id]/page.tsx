import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, Clock, Check, ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface ServiceOfferingPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ServiceOfferingPageProps): Promise<Metadata> {
  const offering = await prisma.serviceOffering.findUnique({
    where: { id: params.id },
    select: { title: true }
  })

  return {
    title: offering ? `${offering.title} | Marketplace` : "Service Offering",
    description: "View service offering details",
  }
}

export default async function ServiceOfferingPage({ params }: ServiceOfferingPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  const offering = await prisma.serviceOffering.findUnique({
    where: { id: params.id },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          createdAt: true
        }
      }
    }
  })

  if (!offering) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Service Not Found"
          text="The service offering you're looking for doesn't exist or has been removed."
        >
          <Link href="/dashboard/marketplace">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
        </DashboardHeader>
      </DashboardShell>
    )
  }

  // Get provider ratings and completed services count
  const completedServicesCount = await prisma.serviceTransaction.count({
    where: {
      providerId: offering.providerId,
      status: 'COMPLETED'
    }
  })

  // Calculate average rating for this provider
  const providerRatings = await prisma.serviceTransaction.findMany({
    where: {
      providerId: offering.providerId,
      clientRating: { not: null }
    },
    select: {
      clientRating: true
    }
  })

  const totalRatings = providerRatings.reduce(
    (sum, transaction) => sum + (transaction.clientRating || 0),
    0
  )
  const averageRating = providerRatings.length > 0
    ? totalRatings / providerRatings.length
    : 0

  // Get reviews for this provider
  const reviews = await prisma.serviceTransaction.findMany({
    where: {
      providerId: offering.providerId,
      clientRating: { not: null },
      clientReview: { not: null }
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    },
    orderBy: {
      completedAt: 'desc'
    },
    take: 5
  })

  // Parse features from string to array
  const features = offering.features
    ? offering.features.split('|').filter(Boolean)
    : []

  const isOwner = session.user.id === offering.providerId

  return (
    <DashboardShell>
      <div className="flex items-center mb-6">
        <Link href="/dashboard/marketplace" className="mr-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
          {offering.category}
        </Badge>
        {isOwner && (
          <Link href={`/dashboard/marketplace/offerings/${offering.id}/edit`} className="ml-auto">
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Offering
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{offering.title}</CardTitle>
              <CardDescription>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Delivery in {offering.deliveryTime}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p>{offering.description}</p>

                {features.length > 0 && (
                  <>
                    <h3 className="text-lg font-medium mt-6 mb-3">What&apos;s Included</h3>
                    <ul className="space-y-2">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-6 border-b last:border-0">
                      <div className="flex items-center mb-2">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={review.client.image || ""} alt={review.client.name || ""} />
                          <AvatarFallback>
                            {review.client.name
                              ? review.client.name.charAt(0).toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{review.client.name}</p>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < (review.clientRating || 0)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                              />
                            ))}
                            <span className="text-xs text-muted-foreground ml-2">
                              {review.completedAt
                                ? formatDistanceToNow(new Date(review.completedAt), {
                                    addSuffix: true,
                                  })
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm">{review.clientReview}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">${offering.price}</CardTitle>
            </CardHeader>
            <CardContent>
              {!isOwner && (
                <Button className="w-full mb-4">Contact Provider</Button>
              )}

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={offering.provider.image || ""} alt={offering.provider.name || ""} />
                    <AvatarFallback>
                      {offering.provider.name
                        ? offering.provider.name.charAt(0).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{offering.provider.name}</p>
                    <div className="flex items-center">
                      {averageRating > 0 && (
                        <>
                          <div className="flex items-center text-yellow-400 mr-2">
                            <Star className="h-4 w-4 fill-current mr-1" />
                            <span className="text-sm">{averageRating.toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ({providerRatings.length} reviews)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="text-sm">
                  <p className="mb-2">
                    <span className="font-medium">Member since:</span>{" "}
                    {new Date(offering.provider.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Completed services:</span>{" "}
                    {completedServicesCount}
                  </p>
                </div>

                {offering.provider.bio && (
                  <>
                    <Separator className="my-3" />
                    <p className="text-sm line-clamp-4">{offering.provider.bio}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
