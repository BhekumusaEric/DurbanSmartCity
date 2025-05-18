import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { ServiceRequestsList } from "@/components/marketplace/service-requests-list"

export const metadata: Metadata = {
  title: "Service Requests",
  description: "Browse all service requests in the marketplace",
}

export default async function RequestsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Service Requests"
        text="Browse all service requests posted by clients in the marketplace."
      >
        <Link href="/dashboard/marketplace/create-request">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Post Request
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid gap-8">
        <ServiceRequestsList />
      </div>
    </DashboardShell>
  )
}
