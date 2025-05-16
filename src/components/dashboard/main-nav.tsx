"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Courses",
    href: "/dashboard/courses",
  },
  {
    title: "Portfolio",
    href: "/dashboard/portfolio",
  },
  {
    title: "Jobs",
    href: "/dashboard/jobs",
  },
  {
    title: "Community",
    href: "/dashboard/community",
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-6">
      <Link
        href="/dashboard"
        className="hidden items-center space-x-2 md:flex"
      >
        <span className="hidden font-bold sm:inline-block">
          Durban Smart City
        </span>
      </Link>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === item.href
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
} 