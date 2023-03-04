import { CheckIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

export default function RegisteredPage() {
  return (
    <main className="flex flex-grow flex-col items-center justify-center pb-16">
      <p className="flex flex-row items-center text-green-600">
        <CheckIcon className="mr-2 inline h-6 w-6" />
        You&apos;re on the list
      </p>
      <p className="mt-2 dark:text-white">
        In the meantime, take a look at the{' '}
        <Link href="https://docs.spackle.so" className="underline">
          documentation
        </Link>{' '}
        or{' '}
        <Link href="mailto:support@spackle.so" className="underline">
          reach out
        </Link>{' '}
        if you have any questions.
      </p>
    </main>
  )
}
