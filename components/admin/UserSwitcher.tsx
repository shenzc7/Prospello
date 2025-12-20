'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Users, UserCheck, Crown, Shield, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRouter } from 'next/navigation'
import { isFeatureEnabled } from '@/config/features'

// Test users for development (matches seed data)
const testUsers = [
  {
    id: 'admin-user',
    email: 'admin@globaltech.dev',
    password: 'Pass@123',
    name: 'Admin User',
    role: 'ADMIN' as const,
    initials: 'AU'
  },
  {
    id: 'manager-user',
    email: 'manager@globaltech.dev',
    password: 'Pass@123',
    name: 'Manager User',
    role: 'MANAGER' as const,
    initials: 'MU'
  },
  {
    id: 'employee-user',
    email: 'me@globaltech.dev',
    password: 'Pass@123',
    name: 'Employee User',
    role: 'EMPLOYEE' as const,
    initials: 'EU'
  }
]

function getRoleIcon(role: string) {
  switch (role) {
    case 'ADMIN':
      return <Crown className="h-4 w-4 text-yellow-600" />
    case 'MANAGER':
      return <Shield className="h-4 w-4 text-blue-600" />
    default:
      return <User className="h-4 w-4 text-green-600" />
  }
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'MANAGER':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-green-100 text-green-800 border-green-200'
  }
}

export function UserSwitcher() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const router = useRouter()
  const featureDisabled = !isFeatureEnabled('userSwitcher')

  const currentUser = session?.user
  const isAdmin = currentUser?.role === 'ADMIN'

  if (featureDisabled) {
    return null
  }

  // Only show for admins or in development
  if (!isAdmin && process.env.NODE_ENV === 'production') {
    return null
  }

  const handleUserSwitch = async (user: typeof testUsers[0]) => {
    setIsSwitching(true)

    try {
      // Sign out current user
      await signIn('credentials', {
        email: user.email,
        password: user.password,
        redirect: false,
      })

      // Close dialog and refresh
      setIsOpen(false)

      // Small delay to allow session update
      setTimeout(() => {
        router.refresh()
        setIsSwitching(false)
      }, 1000)

    } catch (error) {
      console.error('Failed to switch user:', error)
      setIsSwitching(false)
    }
  }

  if (status === 'loading') {
    return (
      <Button variant="outline" size="sm" disabled>
        <Users className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          User Switcher
          {currentUser && (
            <Badge variant="secondary" className="text-xs">
              {currentUser.role}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Switch User Account
          </DialogTitle>
          <DialogDescription>
            Quickly switch between different user accounts for testing purposes.
            This is only available in development or for admin users.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current User */}
          {currentUser && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentUser.image || ''} />
                      <AvatarFallback>
                        {currentUser.name?.split(' ').map(n => n[0]).join('') ||
                          currentUser.email?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <UserCheck className="h-5 w-5 text-green-600 bg-white rounded-full p-0.5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Current User</p>
                    <p className="text-sm text-muted-foreground">{currentUser.name || currentUser.email}</p>
                  </div>
                  <Badge className={getRoleBadgeColor(currentUser.role || 'EMPLOYEE')}>
                    {currentUser.role || 'EMPLOYEE'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Users */}
          <div>
            <h4 className="text-sm font-medium mb-3">Available Accounts</h4>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {testUsers.map((user) => {
                  const isCurrentUser = currentUser?.email === user.email

                  return (
                    <Card
                      key={user.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${isCurrentUser ? 'border-primary/20 bg-primary/5' : ''
                        }`}
                      onClick={() => !isCurrentUser && handleUserSwitch(user)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {user.initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </Badge>
                            {isCurrentUser && (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Switching Status */}
          {isSwitching && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Switching user account...
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Use this tool to test different user roles and permissions</p>
            <p>• All test accounts use password: Pass@123</p>
            <p>• Changes are temporary and reset on refresh</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
