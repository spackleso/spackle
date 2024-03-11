import { Hono, Context } from 'hono'
import customers from './customers'

const app = new Hono()

app.route('/customers', customers)

app.get('/', (c: Context) => {
  return c.json({ message: 'Spackle API V1' })
})

export default app
