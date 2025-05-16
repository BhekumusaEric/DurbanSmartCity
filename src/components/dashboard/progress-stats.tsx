import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Award, Star, BookCheck, TrendingUp } from "lucide-react"

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
  // Calculate a progress percentage (for demo purposes)
  const progressPercentage = Math.min(100, Math.max(0, (completedModules / 10) * 100));

  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Your Learning Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Overall Progress</p>
            <p className="text-sm font-medium">{progressPercentage.toFixed(0)}%</p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Points</p>
              <p className="text-2xl font-bold">{points}</p>
              <p className="text-xs text-muted-foreground mt-1">Earn more by completing courses</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Badges</p>
              <p className="text-2xl font-bold">{badges}</p>
              <p className="text-xs text-muted-foreground mt-1">Showcase your achievements</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
              <BookCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed Modules
              </p>
              <p className="text-2xl font-bold">{completedModules}</p>
              <p className="text-xs text-muted-foreground mt-1">Keep learning to unlock more</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}