import Link from "next/link"
import { Job } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, MapPin, Building, Clock, ArrowRight } from "lucide-react"

interface JobListProps {
  items: Job[]
}

// Helper function to get badge color based on job type
const getBadgeVariant = (type: string) => {
  switch (type) {
    case "FULL_TIME":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30";
    case "PART_TIME":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30";
    case "CONTRACT":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30";
    case "FREELANCE":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/30";
    case "INTERNSHIP":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/30";
    default:
      return "";
  }
};

export function JobList({ items }: JobListProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Career Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((job) => (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="block"
              >
                <div className="group rounded-lg border p-4 transition-all hover:bg-muted/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {job.company && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Building className="h-3 w-3 mr-1" />
                            {job.company}
                          </div>
                        )}
                        {job.location && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location}
                          </div>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge className={getBadgeVariant(job.type)}>
                      {job.type.replace("_", " ")}
                    </Badge>
                  </div>
                  {job.skills && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        {job.skills.split(",").map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end mt-3">
                    <Button variant="ghost" size="sm" className="gap-1 text-green-600 dark:text-green-400">
                      View details <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No jobs available</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Check back later for new opportunities
            </p>
            <Link href="/dashboard/jobs">
              <Button>Browse All Jobs</Button>
            </Link>
          </div>
        )}
      </CardContent>
      {items.length > 0 && (
        <CardFooter className="bg-muted/50 px-6 py-4">
          <Link href="/dashboard/jobs" className="w-full">
            <Button variant="outline" className="w-full">
              View All Job Opportunities
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}