import Link from "next/link"
import { Job } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface JobListProps {
  items: Job[]
}

export function JobList({ items }: JobListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Job Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {items.map((job) => (
          <Link
            key={job.id}
            href={`/dashboard/jobs/${job.id}`}
            className="block space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{job.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {job.company} • {job.location}
                </p>
              </div>
              <Badge>{job.type}</Badge>
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No jobs available.{" "}
            <Link href="/dashboard/jobs" className="underline">
              View all jobs
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
} 