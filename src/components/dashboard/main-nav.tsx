"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Users,
  ShoppingBag,
  Code
} from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Courses",
    href: "/dashboard/courses",
    icon: BookOpen,
  },
  {
    title: "Portfolio",
    href: "/dashboard/portfolio",
    icon: Code,
  },
  {
    title: "Jobs",
    href: "/dashboard/jobs",
    icon: Briefcase,
  },
  {
    title: "Community",
    href: "/dashboard/community",
    icon: Users,
  },
  {
    title: "Marketplace",
    href: "/dashboard/marketplace",
    icon: ShoppingBag,
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center">
      <Link
        href="/dashboard"
        className="hidden items-center space-x-2 mr-6 md:flex"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
          DS
        </div>
        <span className="hidden font-bold sm:inline-block">
          Durban Smart City
        </span>
      </Link>
      <div className="flex items-center space-x-1 sm:space-x-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline-block">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}