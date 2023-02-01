import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('Testing middleware')
  const response = NextResponse.next()
  return response
}
