import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

const courseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string(),
  level: z.string(),
  imageUrl: z.string().optional(),
  creatorId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only mentors and admins can create courses
    if (!["MENTOR", "ADMIN"].includes(session.user.role)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const json = await req.json()
    const body = courseSchema.parse(json)

    const course = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        level: body.level,
        imageUrl: body.imageUrl,
        creatorId: body.creatorId,
      },
    })

    return NextResponse.json(course)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 })
    }

    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 