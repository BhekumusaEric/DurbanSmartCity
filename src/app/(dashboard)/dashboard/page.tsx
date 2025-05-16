import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { CourseList } from "@/components/dashboard/course-list"
import { JobList } from "@/components/dashboard/job-list"
import { ProgressStats } from "@/components/dashboard/progress-stats"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your learning journey overview",
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  const [enrolledCourses, recentJobs, userStats] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        course: true,
      },
      take: 5,
    }),
    prisma.job.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        points: true,
        badges: true,
        completedModules: {
          select: {
            id: true,
          },
        },
      },
    }),
  ])

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome back! Here's an overview of your progress."
      />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <ProgressStats
          className="col-span-4"
          points={userStats?.points ?? 0}
          badges={userStats?.badges.length ?? 0}
          completedModules={userStats?.completedModules.length ?? 0}
        />
        <div className="col-span-3">
          <CourseList
            items={enrolledCourses.map((enrollment) => ({
              id: enrollment.course.id,
              title: enrollment.course.title,
              description: enrollment.course.description,
              progress: enrollment.progress,
            }))}
          />
        </div>
      </div>
      <div className="mt-8">
        <JobList items={recentJobs} />
      </div>
    </DashboardShell>
  )
} 