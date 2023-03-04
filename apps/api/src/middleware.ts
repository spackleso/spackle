import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Defer CORS handling when fetching from Stripe
  if (
    request.method === 'OPTIONS' &&
    (request.nextUrl.pathname.startsWith('/stripe') ||
      request.nextUrl.pathname.startsWith('/marketing'))
  ) {
    return new NextResponse('', { status: 200 })
  }

  return NextResponse.next()
}
