import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { CreateServiceRequestForm } from "@/components/marketplace/create-service-request-form"

export const metadata: Metadata = {
  title: "Create Service Request",
  description: "Post a new service request to find skilled providers",
}

export default async function CreateServiceRequestPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Create Service Request"
        text="Post a new service request to find skilled providers for your project."
      />
      <div className="grid gap-8">
        <CreateServiceRequestForm userId={session.user.id} />
      </div>
    </DashboardShell>
  )
}
