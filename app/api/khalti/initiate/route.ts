import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { order_number, amount, customer_name, customer_phone, customer_email, return_url } = body

  const secretKey = process.env.KHALTI_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Khalti not configured' }, { status: 500 })
  }

  const res = await fetch('https://a.khalti.com/api/v2/epayment/initiate/', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      return_url,
      website_url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://goreto.store',
      amount,
      purchase_order_id: order_number,
      purchase_order_name: `Goreto.store Order ${order_number}`,
      customer_info: {
        name: customer_name,
        email: customer_email,
        phone: customer_phone,
      },
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: 400 })
  }

  return NextResponse.json({ payment_url: data.payment_url, pidx: data.pidx })
}
