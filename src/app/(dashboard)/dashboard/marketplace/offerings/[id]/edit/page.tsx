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
import { EditServiceOfferingForm } from "@/components/marketplace/edit-service-offering-form"

interface EditServiceOfferingPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditServiceOfferingPageProps): Promise<Metadata> {
  const offering = await prisma.serviceOffering.findUnique({
    where: { id: params.id },
    select: { title: true }
  })

  return {
    title: offering ? `Edit ${offering.title}` : "Edit Service Offering",
    description: "Edit your service offering details",
  }
}

export default async function EditServiceOfferingPage({ params }: EditServiceOfferingPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  const offering = await prisma.serviceOffering.findUnique({
    where: { id: params.id },
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

  // Check if user is the owner of the offering
  if (offering.providerId !== session.user.id) {
    redirect("/dashboard/marketplace")
  }

  // Parse features from string to array
  const features = offering.features
    ? offering.features.split('|').filter(Boolean)
    : []

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Edit Service Offering"
        text="Update your service offering details."
      >
        <Link href={`/dashboard/marketplace/offerings/${params.id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Offering
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid gap-8">
        <EditServiceOfferingForm 
          offering={{
            ...offering,
            features
          }}
        />
      </div>
    </DashboardShell>
  )
}
