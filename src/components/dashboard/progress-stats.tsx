import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ProgressStatsProps extends React.HTMLAttributes<HTMLDivElement> {
  points: number
  badges: number
  completedModules: number
}

export function ProgressStats({
  className,
  points,
  badges,
  completedModules,
  ...props
}: ProgressStatsProps) {
  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Points</p>
            <p className="text-2xl font-bold">{points}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Badges</p>
            <p className="text-2xl font-bold">{badges}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Completed Modules
            </p>
            <p className="text-2xl font-bold">{completedModules}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 