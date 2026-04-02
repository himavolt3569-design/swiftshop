import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { phone } = await req.json()

    if (!phone?.match(/^(98|97)\d{8}$/)) {
      return NextResponse.json({ error: 'Invalid Nepal phone number' }, { status: 400 })
    }

    const code = generateOTP()
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    // Delete any existing OTP for this phone
    await supabase.from('otp_sessions').delete().eq('phone', phone)

    // Store new OTP
    const { error: dbError } = await supabase.from('otp_sessions').insert({ phone, code, expires_at })
    if (dbError) throw dbError

    // Send SMS via Sparrow SMS
    const token = process.env.SPARROW_SMS_TOKEN
    const identity = process.env.SPARROW_SMS_IDENTITY

    if (!token || !identity) {
      // Dev mode: return code in response
      return NextResponse.json({ sent: true, dev_code: code })
    }

    const smsRes = await fetch('https://api.sparrowsms.com/v2/sms/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        identity,
        to: phone,
        text: `Your Goreto.store OTP is: ${code}. Valid for 10 minutes. Do not share this code.`,
      }),
    })

    if (!smsRes.ok) {
      const err = await smsRes.text()
      throw new Error(`SMS failed: ${err}`)
    }

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('[OTP send]', err)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
