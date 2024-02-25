import { Container } from '@/components/tailwindui/container'

export default function Signup() {
  return (
    <>
      <main className="flex flex-grow flex-col items-center justify-center">
        <Container className="mt-20 flex flex-col items-center justify-center gap-y-8 rounded-lg border border-4 p-20">
          <div className="flex flex-col gap-y-2 text-center">
            <p className="text-xl font-semibold text-green-400">Success!</p>
            <p className="text-slate-300">Check your email for next steps.</p>
          </div>
        </Container>
      </main>
    </>
  )
}
