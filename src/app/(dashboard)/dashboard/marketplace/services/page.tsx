import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { ServiceOfferingsList } from "@/components/marketplace/service-offerings-list"

export const metadata: Metadata = {
  title: "Service Offerings",
  description: "Browse all service offerings in the marketplace",
}

export default async function ServicesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Service Offerings"
        text="Browse all service offerings available in the marketplace."
      >
        <Link href="/dashboard/marketplace/create-offering">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Offering
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid gap-8">
        <ServiceOfferingsList />
      </div>
    </DashboardShell>
  )
}
