import { Comfortaa, Inter, Lexend } from '@next/font/google'

export const inter = Inter({
  variable: '--font-inter',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const lexend = Lexend({
  variable: '--font-lexend',
  weight: ['400', '500'],
  display: 'swap',
})

export const comfortaa = Comfortaa({
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})
