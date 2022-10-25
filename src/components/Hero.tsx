import { Button } from '@/components/Button'
import { Container } from '@/components/Container'

export function Hero() {
  return (
    <Container className="pt-20 pb-16 text-center lg:pt-32">
      <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
        Custom SaaS billing{' '}
        <span className="relative whitespace-nowrap text-blue-600">
          without
        </span>{' '}
        the code complexity
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
        Bring harmony to your sales process. Let your sales team sell and manage
        custom plans without the engineering overhead.
      </p>
      <div className="mt-10 flex justify-center gap-x-6">
        <Button href="/" color="blue">
          Request Access
        </Button>
      </div>
    </Container>
  )
}
