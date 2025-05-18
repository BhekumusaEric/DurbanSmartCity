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
import { EditServiceRequestForm } from "@/components/marketplace/edit-service-request-form"

interface EditServiceRequestPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditServiceRequestPageProps): Promise<Metadata> {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    select: { title: true }
  })

  return {
    title: request ? `Edit ${request.title}` : "Edit Service Request",
    description: "Edit your service request details",
  }
}

export default async function EditServiceRequestPage({ params }: EditServiceRequestPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  const request = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
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
        heading="Edit Service Request"
        text="Update your service request details."
      >
        <Link href={`/dashboard/marketplace/requests/${params.id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Request
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid gap-8">
        <EditServiceRequestForm request={request} />
      </div>
    </DashboardShell>
  )
}
