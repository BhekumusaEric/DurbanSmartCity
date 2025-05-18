import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionsList } from "@/components/marketplace/transactions-list"

export const metadata: Metadata = {
  title: "Transactions",
  description: "Manage your service transactions",
}

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Transactions"
        text="Manage your service transactions, both as a client and provider."
      />
      
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="as-client">As Client</TabsTrigger>
          <TabsTrigger value="as-provider">As Provider</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <TransactionsList userId={session.user.id} role="all" />
        </TabsContent>
        <TabsContent value="as-client" className="space-y-4">
          <TransactionsList userId={session.user.id} role="client" />
        </TabsContent>
        <TabsContent value="as-provider" className="space-y-4">
          <TransactionsList userId={session.user.id} role="provider" />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
