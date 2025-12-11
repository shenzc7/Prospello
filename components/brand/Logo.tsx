"use client"

import React from 'react'
import { TrendingUp } from 'lucide-react'
import { strings } from '@/config/strings'
import { cn } from '@/lib/utils'

type LogoProps = {
  size?: number
  showName?: boolean
  className?: string
  textClassName?: string
  variant?: 'default' | 'hero'
}

export function Logo({ size = 36, showName = false, className, textClassName, variant = 'default' }: LogoProps) {
  const logoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL
  const name = strings.app.name

  if (variant === 'hero') {
    return (
      <div className={cn('flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/90 shadow-card-hover relative overflow-hidden', className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <span className="relative text-4xl font-black text-primary-foreground tracking-tight">OKR</span>
      </div>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
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
        <span className={cn('font-display font-semibold tracking-tight text-xl', textClassName || className)}>{name}</span>
      ) : null}
    </span>
  )
}
