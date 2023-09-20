import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Defer CORS handling when fetching from Stripe or Marketing
  if (
    request.method === 'OPTIONS' &&
    (request.nextUrl.pathname.startsWith('/stripe') ||
      request.nextUrl.pathname.startsWith('/api/stripe') ||
      request.nextUrl.pathname.startsWith('/marketing') ||
      request.nextUrl.pathname.startsWith('/api/marketing') ||
      request.nextUrl.pathname.startsWith('/v1/pricing_tables/'))
  ) {
    return new NextResponse('', { status: 200 })
  }

  return NextResponse.next()
}
