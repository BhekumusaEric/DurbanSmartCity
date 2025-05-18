import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProposalsList } from "@/components/marketplace/proposals-list"

interface ProposalsPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ProposalsPageProps): Promise<Metadata> {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    select: { title: true }
  })

  return {
    title: request ? `Proposals for ${request.title}` : "Proposals",
    description: "View and manage proposals for your service request",
  }
}

export default async function ProposalsPage({ params }: ProposalsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  const request = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      requestedById: true,
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

  // Check if user is the owner of the request
  if (request.requestedById !== session.user.id) {
    redirect("/dashboard/marketplace")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Proposals for "${request.title}"`}
        text="Review and manage proposals from service providers."
      >
        <Link href={`/dashboard/marketplace/requests/${request.id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Request
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid gap-8">
        <ProposalsList requestId={request.id} />
      </div>
    </DashboardShell>
  )
}
