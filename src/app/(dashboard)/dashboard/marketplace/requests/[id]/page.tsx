import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, ArrowLeft, Edit, Users } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { SubmitProposalButton } from "@/components/marketplace/submit-proposal-button"

interface ServiceRequestPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ServiceRequestPageProps): Promise<Metadata> {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    select: { title: true }
  })

  return {
    title: request ? `${request.title} | Marketplace` : "Service Request",
    description: "View service request details",
  }
}

export default async function ServiceRequestPage({ params }: ServiceRequestPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  const request = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    include: {
      requestedBy: {
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true
        }
      },
      proposals: {
        select: {
          id: true,
          providerId: true
        }
      }
    }
  })

  if (!request) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Request Not Found"
          text="The service request you're looking for doesn't exist or has been removed."
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

  const isOwner = session.user.id === request.requestedById
  const hasSubmittedProposal = request.proposals.some(
    (proposal) => proposal.providerId === session.user.id
  )
  const canSubmitProposal = !isOwner && !hasSubmittedProposal && request.status === "OPEN"

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

  return (
    <DashboardShell>
      <div className="flex items-center mb-6">
        <Link href="/dashboard/marketplace" className="mr-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800 mr-2">
          {request.category}
        </Badge>
        <Badge className={getStatusColor(request.status)}>
          {request.status.replace("_", " ")}
        </Badge>
        {isOwner && (
          <Link href={`/dashboard/marketplace/requests/${request.id}/edit`} className="ml-auto">
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Request
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{request.title}</CardTitle>
              <CardDescription>
                <div className="flex items-center mt-2">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {request.deadline
                      ? `Deadline: ${formatDistanceToNow(new Date(request.deadline), { addSuffix: true })}`
                      : "No deadline specified"}
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p>{request.description}</p>
              </div>
            </CardContent>
          </Card>

          {isOwner && request.proposals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Proposals ({request.proposals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View and manage proposals from service providers.
                </p>
                <Link href={`/dashboard/marketplace/requests/${request.id}/proposals`}>
                  <Button>View All Proposals</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Budget</p>
                <p className="text-lg font-bold">
                  {request.budget ? `$${request.budget}` : "Not specified"}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Proposals</p>
                <p className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{request.proposals.length} proposals received</span>
                </p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium mb-2">Posted by</p>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={request.requestedBy.image || ""} alt={request.requestedBy.name || ""} />
                    <AvatarFallback>
                      {request.requestedBy.name
                        ? request.requestedBy.name.charAt(0).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.requestedBy.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Member since {new Date(request.requestedBy.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 flex justify-center">
              {canSubmitProposal ? (
                <SubmitProposalButton requestId={request.id} />
              ) : hasSubmittedProposal ? (
                <p className="text-sm text-muted-foreground">You have already submitted a proposal</p>
              ) : !isOwner && request.status !== "OPEN" ? (
                <p className="text-sm text-muted-foreground">This request is no longer accepting proposals</p>
              ) : null}
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
