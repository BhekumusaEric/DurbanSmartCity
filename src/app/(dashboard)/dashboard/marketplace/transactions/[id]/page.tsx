import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { TransactionActions } from "@/components/marketplace/transaction-actions"
import { TransactionTimeline } from "@/components/marketplace/transaction-timeline"
import { TransactionReviews } from "@/components/marketplace/transaction-reviews"

interface TransactionPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: TransactionPageProps): Promise<Metadata> {
  const transaction = await prisma.serviceTransaction.findUnique({
    where: { id: params.id },
    include: {
      proposal: {
        include: {
          request: {
            select: { title: true }
          }
        }
      }
    }
  })

  return {
    title: transaction ? `Transaction for ${transaction.proposal.request.title}` : "Transaction",
    description: "Manage your service transaction",
  }
}

export default async function TransactionPage({ params }: TransactionPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  const transaction = await prisma.serviceTransaction.findUnique({
    where: { id: params.id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      provider: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      proposal: {
        include: {
          request: {
            select: {
              id: true,
              title: true,
              description: true
            }
          }
        }
      }
    }
  })

  if (!transaction) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Transaction Not Found"
          text="The transaction you're looking for doesn't exist or has been removed."
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

  // Check if user is involved in the transaction
  const isClient = session.user.id === transaction.clientId
  const isProvider = session.user.id === transaction.providerId

  if (!isClient && !isProvider) {
    redirect("/dashboard/marketplace")
  }

  const otherParty = isClient ? transaction.provider : transaction.client
  const userRole = isClient ? "client" : "provider"

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "DISPUTED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U"
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Transaction Details"
        text={`Manage your transaction for "${transaction.proposal.request.title}"`}
      >
        <div className="flex space-x-2">
          <Link href="/dashboard/marketplace">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <Link href={`/dashboard/marketplace/messages?with=${otherParty.id}`}>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Message {otherParty.name}
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Service Details</CardTitle>
                <CardDescription>
                  Transaction ID: {transaction.id}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(transaction.status)}>
                {transaction.status.replace("_", " ")}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <h3 className="text-lg font-semibold mb-2">{transaction.proposal.request.title}</h3>
              <p className="text-muted-foreground mb-4">{transaction.proposal.request.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium mb-1">Amount</p>
                  <p className="text-lg font-bold">${transaction.amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Delivery Time</p>
                  <p>{transaction.proposal.deliveryTime}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Client</p>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={transaction.client.image || ""} alt={transaction.client.name || ""} />
                      <AvatarFallback>{getInitials(transaction.client.name || "")}</AvatarFallback>
                    </Avatar>
                    <span>{transaction.client.name}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Provider</p>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={transaction.provider.image || ""} alt={transaction.provider.name || ""} />
                      <AvatarFallback>{getInitials(transaction.provider.name || "")}</AvatarFallback>
                    </Avatar>
                    <span>{transaction.provider.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 flex justify-center">
              <TransactionActions
                transaction={transaction}
                userRole={userRole}
              />
            </CardFooter>
          </Card>

          <TransactionTimeline transaction={transaction} userRole={userRole} />

          {transaction.status === "COMPLETED" && (
            <TransactionReviews
              transaction={transaction}
              userRole={userRole}
            />
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Amount</p>
                <p className="text-lg font-bold">${transaction.amount}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <Badge className={getStatusColor(transaction.status)}>
                  {transaction.status.replace("_", " ")}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Created</p>
                <p>{format(new Date(transaction.createdAt), "PPP")}</p>
              </div>

              {transaction.completedAt && (
                <div>
                  <p className="text-sm font-medium mb-1">Completed</p>
                  <p>{format(new Date(transaction.completedAt), "PPP")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                If you&apos;re experiencing issues with this transaction, our support team is here to help.
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
