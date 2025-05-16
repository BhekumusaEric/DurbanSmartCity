import { cn } from "@/lib/utils"
import { ReactNode } from "react"

// DashboardShellProps extends HTMLDivElement attributes to allow passing standard HTML div props
interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export function DashboardShell({
  children,
  className,
  ...props
}: DashboardShellProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid items-start gap-8", className)} {...props}>
      {children}
    </div>
  )
} 