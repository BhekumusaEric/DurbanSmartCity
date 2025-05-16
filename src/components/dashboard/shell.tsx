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
    <div
      className={cn(
        "grid items-start gap-8 p-1 sm:p-4 md:p-6 lg:p-8 relative",
        "bg-gradient-to-b from-background to-background/80 backdrop-blur-sm",
        "min-h-[calc(100vh-4rem)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}