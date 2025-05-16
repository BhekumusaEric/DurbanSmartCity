import {
  Loader2,
  Github,
  Plus,
  type LucideIcon,
} from "lucide-react"

export type Icon = LucideIcon

export const Icons = {
  spinner: Loader2,
  gitHub: Github,
  plus: Plus,
} as const 