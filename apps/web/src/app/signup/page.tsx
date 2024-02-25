import { Container } from '@/components/tailwindui/container'

export default function Signup() {
  return (
    <main className="flex flex-grow flex-col items-center justify-center">
      <Container className="mt-20 flex flex-col items-center justify-center gap-y-8 rounded-lg border border-4 p-20">
        <div className="flex flex-col gap-y-4">
          <h2 className="font-display mx-auto max-w-4xl text-center text-3xl font-medium tracking-tight text-slate-100 dark:text-white sm:text-4xl">
            Get Started
          </h2>
          <p className="text-lg leading-8 text-slate-400">
            100% free for the first $1,000 MTR*
          </p>
        </div>
        <form
          action="https://api.spackle.so/signup"
          method="POST"
          className="w-full max-w-xs rounded-lg"
        >
          <div className="w-full">
            <label
              htmlFor="email"
              className="block text-sm font-semibold leading-6 text-slate-100"
            >
              Email
            </label>
            <div className="mt-2.5">
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="block w-full rounded-md border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-violet-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
              >
                Submit
              </button>
            </div>
          </div>
        </form>
        <div className="max-w-md text-sm text-slate-500 dark:text-slate-300">
          <p className="text-center leading-4">
            * MTR = Monthly tracked revenue. The amount of revenue managed by
            Spackle in a given month.
          </p>
        </div>
      </Container>
    </main>
  )
}
