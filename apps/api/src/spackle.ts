import Spackle from 'spackle-node'

const spackle = new Spackle(process.env.SPACKLE_API_KEY ?? '')

if (process.env.NODE_ENV === 'development') {
  spackle.apiBase = 'http://localhost:3000/v1'
}

export default spackle
