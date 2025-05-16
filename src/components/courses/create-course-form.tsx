"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

export enum CourseCategory {
  WEB_DEVELOPMENT = "web-development",
  MOBILE_DEVELOPMENT = "mobile-development",
  DATA_SCIENCE = "data-science",
  CYBERSECURITY = "cybersecurity",
  AI_ML = "ai-ml",
}

export enum CourseLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(500, {
    message: "Description must not exceed 500 characters.",
  }),
  category: z.nativeEnum(CourseCategory, {
    required_error: "Please select a category.",
    invalid_type_error: "Invalid category selected.",
  }),
  level: z.nativeEnum(CourseLevel, {
    required_error: "Please select a difficulty level.",
    invalid_type_error: "Invalid level selected.",
  }),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
})

interface CreateCourseFormProps {
  userId: string
}

export function CreateCourseForm({ userId }: CreateCourseFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [toast, setToast] = React.useState<{
    title: string
    description: string
    variant: "default" | "success" | "destructive"
  } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: undefined,
      level: undefined,
      imageUrl: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          creatorId: userId,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Failed to create course")
      }

      const course = await response.json()

      setToast({
        title: "Success!",
        description: "Course created successfully",
        variant: "success",
      })

      // Wait for the toast to be visible before redirecting
      setTimeout(() => {
        router.push(`/dashboard/courses/${course.id}`)
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error("Course creation error:", error)
      setToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create course",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="space-y-8 animate-in fade-in-50 duration-500"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Introduction to Web Development" 
                        {...field}
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </FormControl>
                    <FormDescription>
                      The title of your course. Make it clear and engaging.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Learn the fundamentals of web development..."
                        className="min-h-[120px] resize-y transition-all duration-200 focus:scale-[1.01]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="flex justify-between">
                      <span>A detailed description of what students will learn.</span>
                      <span className={cn(
                        "text-muted-foreground",
                        field.value.length > 450 && "text-yellow-600",
                        field.value.length > 500 && "text-red-600"
                      )}>
                        {field.value.length}/500
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="transition-all duration-200 focus:scale-[1.01]">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CourseCategory).map(([key, value]) => (
                        <SelectItem key={value} value={value}>
                          {key.split("_").map(word => 
                            word.charAt(0) + word.slice(1).toLowerCase()
                          ).join(" ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The main category of your course.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="transition-all duration-200 focus:scale-[1.01]">
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CourseLevel).map(([key, value]) => (
                        <SelectItem key={value} value={value}>
                          {key.charAt(0) + key.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The difficulty level of your course.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/course-image.jpg" 
                        {...field}
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </FormControl>
                    <FormDescription>
                      A URL to an image that represents your course. Leave empty to use a default image.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full sm:w-auto transition-all duration-200 hover:scale-[1.02]"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Creating Course...
              </>
            ) : (
              <>
                <Icons.plus className="mr-2 h-4 w-4" />
                Create Course
              </>
            )}
          </Button>
        </form>
      </Form>

      <ToastProvider>
        {toast && (
          <Toast variant={toast.variant}>
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
          </Toast>
        )}
        <ToastViewport />
      </ToastProvider>
    </>
  )
} 