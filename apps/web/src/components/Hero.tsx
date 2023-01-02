import { Container } from '@/components/Container'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { CheckIcon } from '@heroicons/react/20/solid'

export function Hero() {
  const [email, setEmail] = useState('')

  const requestAccess = useMutation(
    async ({ user_email }: { user_email: string }) => {
      const response = await fetch(
        'https://api.spackle.com/marketing/add_to_waitlist',
        {
          method: 'POST',
          body: JSON.stringify({ user_email }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (response.status !== 200) {
        const error = (await response.json()).error
        throw new Error(error)
      }

      return response
    },
  )

  return (
    <Container className="pt-20 pb-16 text-center lg:pt-32">
      <h1 className="font-display mx-auto max-w-4xl text-5xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-7xl">
        Enterprise billing{' '}
        <span className="relative whitespace-nowrap text-violet-600">
          without
        </span>{' '}
        the code complexity
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700 dark:text-slate-400">
        Bring harmony to your sales process. Sell and manage custom product
        experiences right from the Stripe dashboard.
      </p>
      <form
        className="mt-10 flex justify-center"
        onSubmit={(e) => {
          e.preventDefault()
          requestAccess.mutate({ user_email: email })
        }}
      >
        {requestAccess.isSuccess ? (
          <div className="flex flex-row justify-center">
            <CheckIcon className="mr-2 h-6 w-6 text-green-600" />
            <p className="text-green-600">You&apos;re on the list</p>
          </div>
        ) : (
          <>
            <input
              type="text"
              className="rounded-l-lg border bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              placeholder="jane@example.com"
              disabled={requestAccess.isLoading}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={requestAccess.isLoading}
              className={`rounded-r-lg px-3 text-sm font-semibold text-white text-white ring-slate-700 hover:ring-slate-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:text-slate-400 active:ring-slate-700 ${
                requestAccess.isLoading ? 'bg-slate-400' : 'bg-violet-600'
              }`}
            >
              {requestAccess.isLoading ? <>...</> : <>Request Access</>}
            </button>
          </>
        )}
      </form>
      {requestAccess.error && (
        <p className="justify-left mt-1 text-red-500">
          {(requestAccess.error as any).message}
        </p>
      )}
    </Container>
  )
}
