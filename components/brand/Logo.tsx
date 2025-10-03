"use client"

import React from 'react'
import { TrendingUp } from 'lucide-react'
import { strings } from '@/config/strings'
import { cn } from '@/lib/utils'

type LogoProps = {
  size?: number
  showName?: boolean
  className?: string
}

export function Logo({ size = 36, showName = false, className }: LogoProps) {
  const logoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL
  const name = strings.app.name

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          width={size}
          height={size}
          className="rounded-2xl shadow-soft"
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft"
          style={{ width: size, height: size }}
        >
          <TrendingUp className="h-1/2 w-1/2" aria-hidden />
        </span>
      )}
      {showName ? (
        <span className={cn('font-display font-semibold tracking-tight', className)}>{name}</span>
      ) : null}
    </span>
  )
}

