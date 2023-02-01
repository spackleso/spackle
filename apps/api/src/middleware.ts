import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Defer CORS handling when fetching from Stripe
  if (
    request.method === 'OPTIONS' &&
    request.nextUrl.pathname.startsWith('/stripe')
  ) {
    return new NextResponse('', { status: 200 })
  }

  const response = NextResponse.next()
  return response
}
