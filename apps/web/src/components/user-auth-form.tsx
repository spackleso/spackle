'use client'

import { buttonVariants } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { usePostHog } from 'posthog-js/react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Loader2 } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

export const userAuthSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
})
type FormData = z.infer<typeof userAuthSchema>

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
    defaultValues: {
      email: '',
    },
  })
  const posthog = usePostHog()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [success, setSuccess] = React.useState<boolean>(false)

  async function onSubmit(data: FormData) {
    setIsLoading(true)

    const signInResult = await fetch('https://api.spackle.so/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        distinct_id: posthog.get_distinct_id(),
      }),
    })

    setIsLoading(false)

    if (!signInResult?.ok) {
      return toast.error('Something went wrong.', {
        description: 'Your sign in request failed. Please try again.',
      })
    }

    setSuccess(true)
    return toast.success('Check your email', {
      description: 'We sent you next steps. Be sure to check your spam too.',
    })
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <button
              type="submit"
              className={cn(buttonVariants())}
              disabled={isLoading || success}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {success && <Check className="mr-2 h-4 w-4" />}
              {success ? 'Check your email' : 'Sign Up with Email'}
            </button>
          </div>
        </form>
      </Form>
    </div>
  )
}
