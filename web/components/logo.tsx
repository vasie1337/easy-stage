'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface LogoProps {
  size?: number
  showText?: boolean
  href?: string | null
}

export function Logo({ size = 32, showText = true, href = '/' }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by showing nothing until mounted
  const logoSrc = mounted 
    ? resolvedTheme === 'dark' ? '/logo_dark.svg' : '/logo_light.svg'
    : '/logo_light.svg'

  const content = (
    <div className="flex items-center gap-2">
      <Image
        src={logoSrc}
        alt="easystage.nl"
        width={size}
        height={size}
        priority
      />
      {showText && <span className="font-semibold">easystage.nl</span>}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {content}
      </Link>
    )
  }

  return content
}
