import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('otp_sessions')
      .select('code, expires_at')
      .eq('phone', phone)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'OTP not found. Please request a new one.' }, { status: 400 })
    }

    if (new Date(data.expires_at) < new Date()) {
      await supabase.from('otp_sessions').delete().eq('phone', phone)
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 })
    }

    if (data.code !== code.trim()) {
      return NextResponse.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400 })
    }

    // Clean up used OTP
    await supabase.from('otp_sessions').delete().eq('phone', phone)

    return NextResponse.json({ verified: true })
  } catch (err) {
    console.error('[OTP verify]', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
