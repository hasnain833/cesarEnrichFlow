import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/'

  try {
    const supabase = await createClient()

    // Handle ConfirmationURL format (token_hash + type) or RedirectTo format (code)
    if (token_hash && type) {
      // This is from {{ .ConfirmationURL }} - use verifyOtp
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })

      if (error) {
        console.error('Email verification error:', error.message)
        throw error
      }

      if (data?.user) {
        // Success - redirect to home
        const redirectUrl = new URL('/', requestUrl.origin)
        return NextResponse.redirect(redirectUrl, { status: 307 })
      }
    } else if (code) {
      // This is from {{ .RedirectTo }} - use exchangeCodeForSession
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Email verification error:', error.message)
        
        // Check if user is already verified (common case)
        if (error.message?.includes('already been used') || error.message?.includes('expired')) {
          // Code already used or expired - user might already be verified
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email_confirmed_at) {
            // User is already verified, redirect to success
            const redirectUrl = new URL('/', requestUrl.origin)
            return NextResponse.redirect(redirectUrl, { status: 307 })
          }
        }

        // Redirect with specific error
        const errorUrl = new URL('/', requestUrl.origin)
        errorUrl.searchParams.set('error', 'email_verification_failed')
        errorUrl.searchParams.set('reason', error.message || 'unknown')
        return NextResponse.redirect(errorUrl, { status: 307 })
      }

      // Success - redirect to home or next parameter
      if (data?.user) {
        const redirectUrl = new URL('/', requestUrl.origin)
        return NextResponse.redirect(redirectUrl, { status: 307 })
      }
    } else {
      // No code or token_hash provided
      const errorUrl = new URL('/', requestUrl.origin)
      errorUrl.searchParams.set('error', 'email_verification_failed')
      errorUrl.searchParams.set('reason', 'no_verification_data')
      return NextResponse.redirect(errorUrl, { status: 307 })
    }

    // Fallback - redirect with error
    const errorUrl = new URL('/', requestUrl.origin)
    errorUrl.searchParams.set('error', 'email_verification_failed')
    errorUrl.searchParams.set('reason', 'no_user')
    return NextResponse.redirect(errorUrl, { status: 307 })
  } catch (error: any) {
    console.error('Unexpected error in email verification:', error)
    const errorUrl = new URL('/', requestUrl.origin)
    errorUrl.searchParams.set('error', 'email_verification_failed')
    errorUrl.searchParams.set('reason', 'unexpected_error')
    return NextResponse.redirect(errorUrl, { status: 307 })
  }
}

