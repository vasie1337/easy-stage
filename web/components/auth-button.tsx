'use client'

import { useConvexAuth, useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AuthButton() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signOut } = useAuthActions()
  const user = useQuery(api.users.currentUser)

  async function handleSignOut() {
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  }

  if (!isAuthenticated) {
    return (
      <Link href="/sign-in">
        <Button variant="outline" size="sm">Inloggen</Button>
      </Link>
    )
  }

  const userImage = user?.image
  const userName = user?.name
  const userEmail = user?.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full overflow-hidden p-0">
          {userImage ? (
            <img 
              src={userImage} 
              alt={userName || 'User'} 
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          {userName && (
            <p className="text-sm font-medium truncate">{userName}</p>
          )}
          {userEmail && (
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" />
          Uitloggen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
