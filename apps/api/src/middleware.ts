import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/logger'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const log = `${request.ip ? request.ip + ': ' : ''}${request.method} ${
    request.nextUrl.pathname
  } [${response.status}]`
  logger.log(log)
  return response
}
