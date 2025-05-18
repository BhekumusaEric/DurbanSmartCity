import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { CreateServiceOfferingForm } from "@/components/marketplace/create-service-offering-form"

export const metadata: Metadata = {
  title: "Create Service Offering",
  description: "Create a new service offering for the marketplace",
}

export default async function CreateServiceOfferingPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Create Service Offering"
        text="Create a new service offering to showcase your skills and earn income."
      />
      <div className="grid gap-8">
        <CreateServiceOfferingForm userId={session.user.id} />
      </div>
    </DashboardShell>
  )
}
