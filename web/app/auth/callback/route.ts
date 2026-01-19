import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to the original page or /stages
      return NextResponse.redirect(`${origin}${redirect || '/stages'}`)
    }
  }

  // Auth error, redirect to sign-in
  return NextResponse.redirect(`${origin}/sign-in?error=auth`)
}
