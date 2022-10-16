import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  success: boolean
}

export default async function handler() {
  console.log('called!')
}
