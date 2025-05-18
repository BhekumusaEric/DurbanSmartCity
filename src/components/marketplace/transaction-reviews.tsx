"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"

interface Transaction {
  clientReview?: string
  clientRating?: number
  providerReview?: string
  providerRating?: number
  completedAt?: string
  client: {
    name: string
    image?: string
  }
  provider: {
    name: string
    image?: string
  }
}

interface TransactionReviewsProps {
  transaction: Transaction
}

export function TransactionReviews({ transaction }: TransactionReviewsProps) {
  const hasClientReview = transaction.clientReview && transaction.clientRating
  const hasProviderReview = transaction.providerReview && transaction.providerRating

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U"
  }

  if (!hasClientReview && !hasProviderReview) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasClientReview && (
          <div className="pb-6 border-b last:border-0 last:pb-0">
            <div className="flex items-center mb-2">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={transaction.client.image || ""} alt={transaction.client.name || ""} />
                <AvatarFallback>{getInitials(transaction.client.name || "")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{transaction.client.name}</p>
                <p className="text-xs text-muted-foreground">
                  Client • {transaction.completedAt ? format(new Date(transaction.completedAt), "MMM d, yyyy") : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-lg ${
                    i < transaction.clientRating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>

            <p className="text-sm">{transaction.clientReview}</p>
          </div>
        )}

        {hasProviderReview && (
          <div>
            <div className="flex items-center mb-2">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={transaction.provider.image || ""} alt={transaction.provider.name || ""} />
                <AvatarFallback>{getInitials(transaction.provider.name || "")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{transaction.provider.name}</p>
                <p className="text-xs text-muted-foreground">
                  Provider • {transaction.completedAt ? format(new Date(transaction.completedAt), "MMM d, yyyy") : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-lg ${
                    i < transaction.providerRating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>

            <p className="text-sm">{transaction.providerReview}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
