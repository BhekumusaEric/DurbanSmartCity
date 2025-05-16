import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { CreateCourseForm } from "@/components/courses/create-course-form"

export const metadata: Metadata = {
  title: "Create Course",
  description: "Create a new course for the platform",
}

export default async function CreateCoursePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  // Only mentors and admins can create courses
  if (!["MENTOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Create Course"
        text="Create a new course to share your knowledge."
      />
      <div className="grid gap-8">
        <CreateCourseForm userId={session.user.id} />
      </div>
    </DashboardShell>
  )
} 