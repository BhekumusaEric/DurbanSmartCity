import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

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
    <Card>
      <CardHeader>
        <CardTitle>Your Courses</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {items.map((course) => (
          <Link
            key={course.id}
            href={`/dashboard/courses/${course.id}`}
            className="block space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{course.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {course.description}
                </p>
              </div>
            </div>
            <Progress value={course.progress} className="h-2" />
          </Link>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No courses enrolled yet.{" "}
            <Link href="/dashboard/courses" className="underline">
              Browse courses
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
} 