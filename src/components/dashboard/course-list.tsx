import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { BookOpen, ArrowRight } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  progress: number
}

interface CourseListProps {
  items: Course[]
}

export function CourseList({ items }: CourseListProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Your Learning Path
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {items.length > 0 ? (
          <div className="space-y-6">
            {items.map((course) => (
              <div
                key={course.id}
                className="group rounded-lg border p-4 transition-all hover:bg-muted/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>
                  <span className="text-sm font-medium">
                    {course.progress.toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {course.description}
                </p>
                <Progress value={course.progress} className="h-2 mb-3" />
                <div className="flex justify-end">
                  <Link href={`/dashboard/courses/${course.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1 text-blue-600 dark:text-blue-400">
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No courses yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start your learning journey by enrolling in courses
            </p>
            <Link href="/dashboard/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        )}
      </CardContent>
      {items.length > 0 && (
        <CardFooter className="bg-muted/50 px-6 py-4">
          <Link href="/dashboard/courses" className="w-full">
            <Button variant="outline" className="w-full">
              View All Courses
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}