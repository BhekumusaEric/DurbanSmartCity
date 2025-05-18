import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ServiceOfferingsList } from "@/components/marketplace/service-offerings-list"
import { ServiceRequestsList } from "@/components/marketplace/service-requests-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Find services or offer your skills to earn",
}

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Marketplace"
        text="Find services or offer your skills to earn income while building your professional experience."
      >
        <div className="flex space-x-2">
          <Link href="/dashboard/marketplace/create-offering">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Offering
            </Button>
          </Link>
          <Link href="/dashboard/marketplace/create-request">
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Post Request
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      <Tabs defaultValue="offerings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="offerings">Service Offerings</TabsTrigger>
          <TabsTrigger value="requests">Service Requests</TabsTrigger>
          <TabsTrigger value="my-services">My Services</TabsTrigger>
        </TabsList>
        <TabsContent value="offerings" className="space-y-4">
          <ServiceOfferingsList />
        </TabsContent>
        <TabsContent value="requests" className="space-y-4">
          <ServiceRequestsList />
        </TabsContent>
        <TabsContent value="my-services" className="space-y-4">
          <Tabs defaultValue="my-offerings">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="my-offerings">My Offerings</TabsTrigger>
              <TabsTrigger value="my-requests">My Requests</TabsTrigger>
              <TabsTrigger value="my-proposals">My Proposals</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="my-offerings" className="mt-6">
              <ServiceOfferingsList userId={session.user.id} isOwner={true} />
            </TabsContent>
            <TabsContent value="my-requests" className="mt-6">
              <ServiceRequestsList userId={session.user.id} isOwner={true} />
            </TabsContent>
            <TabsContent value="my-proposals" className="mt-6">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium">My Proposals</h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage proposals you&apos;ve submitted to service requests.
                  </p>
                </div>
                {/* ProposalsList component will be implemented later */}
              </div>
            </TabsContent>
            <TabsContent value="transactions" className="mt-6">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium">My Transactions</h3>
                  <p className="text-sm text-muted-foreground">
                    View your service transactions, both as a client and provider.
                  </p>
                </div>
                {/* TransactionsList component will be implemented later */}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
