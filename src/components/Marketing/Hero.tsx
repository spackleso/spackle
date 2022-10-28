import { Container } from '@/components/Marketing/Container'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { CheckIcon } from '@heroicons/react/20/solid'

export function Hero() {
  const [email, setEmail] = useState('')

  const requestAccess = useMutation(
    async ({ user_email }: { user_email: string }) => {
      const response = await fetch('api/marketing/add_to_waitlist', {
        method: 'POST',
        body: JSON.stringify({ user_email }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status !== 200) {
        const error = (await response.json()).error
        throw new Error(error)
      }

      return response
    },
  )

  return (
    <Container className="pt-20 pb-16 text-center lg:pt-32">
      <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
        Custom SaaS billing{' '}
        <span className="relative whitespace-nowrap text-blue-600">withou</span>{' '}
        the code complexity
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
        Bring harmony to your sales process. Let your sales team sell and manage
        custom plans from the Stripe dashboard
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
            <CheckIcon className="w-6 h-6 text-green-600 mr-2" />
            <p className="text-green-600">You&apos;re on the list</p>
          </div>
        ) : (
          <>
            <input
              type="text"
              className="border rounded-l-lg px-3 py-2"
              placeholder="jane@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={requestAccess.isLoading}
              className="bg-blue-600 rounded-r-lg text-white px-3 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ring-slate-700 text-white hover:ring-slate-500 active:ring-slate-700 active:text-slate-400 focus-visible:outline-white"
            >
              {requestAccess.isLoading ? <>...</> : <>Request Access</>}
            </button>
          </>
        )}
      </form>
      {requestAccess.error && (
        <p className="text-red-500 justify-left mt-1">
          {(requestAccess.error as any).message}
        </p>
      )}
    </Container>
  )
}
