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
      <div className="relative">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>

        <DashboardHeader
          heading="Dashboard"
          text={`Welcome back, ${session.user.name?.split(' ')[0] || 'there'}! Here's an overview of your progress.`}
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7 mb-8">
          <ProgressStats
            className="col-span-4 shadow-card hover:shadow-card-hover transition-shadow duration-300"
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

        <div className="mb-8">
          <JobList items={recentJobs} />
        </div>

        {/* Upcoming Events Card */}
        <div className="bg-card rounded-lg border shadow-card overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
            <h3 className="font-bold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Upcoming Events
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Web Development Workshop</h4>
                  <p className="text-sm text-muted-foreground">Tomorrow, 3:00 PM - 5:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Networking Event</h4>
                  <p className="text-sm text-muted-foreground">Friday, 6:00 PM - 8:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Project Submission Deadline</h4>
                  <p className="text-sm text-muted-foreground">Next Monday, 11:59 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}