import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect')
  
  // Use env var for production, fallback to request origin for local dev
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to the original page or /stages
      return NextResponse.redirect(`${siteUrl}${redirect || '/stages'}`)
    }
  }

  // Auth error, redirect to sign-in
  return NextResponse.redirect(`${siteUrl}/sign-in?error=auth`)
}
