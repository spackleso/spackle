import {
  Box,
  Button,
  Divider,
  Icon,
  Spinner,
  TextField,
} from '@stripe/ui-extension-sdk/ui'
import useAccount from '../hooks/useAccount'
import { ReactNode, useEffect, useCallback, useState } from 'react'
import useApi from '../hooks/useApi'
import useStripeContext from '../hooks/useStripeContext'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '../query'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const LoadingSpinner = ({ children }: { children?: ReactNode }) => {
  return (
    <Box
      css={{
        stack: 'y',
        alignX: 'center',
        alignY: 'center',
        width: 'fill',
        height: 'fill',
        gap: 'small',
      }}
    >
      {children}
      <Spinner />
    </Box>
  )
}

const InviteInterstitial = ({ account }: { account: any }) => {
  const { post } = useApi()
  const [email, setEmail] = useState('')
  const [inviteToken, setInviteToken] = useState('')

  const requestAccess = useMutation(
    async ({ user_email }: { user_email: string }) => {
      const response = await post('api/stripe/add_to_waitlist', {
        user_email,
      })

      if (response.status !== 200) {
        const error = (await response.json()).error
        throw new Error(error)
      }

      queryClient.invalidateQueries(['account', account.stripe_id])
      return response
    },
  )

  const acceptInvite = useMutation(async ({ token }: { token: string }) => {
    const response = await post('api/stripe/accept_invite', {
      token,
    })

    if (response.status !== 200) {
      const error = (await response.json()).error
      throw new Error(error)
    }

    queryClient.invalidateQueries(['account', account.stripe_id])
    return response
  })

  return (
    <Box
      css={{
        stack: 'y',
        width: 'fill',
        height: 'fill',
        gap: 'small',
        paddingY: 'xxlarge',
        paddingX: 'medium',
      }}
    >
      <Box css={{ width: 'fill' }}>
        <Box css={{ paddingY: 'medium', marginY: 'medium' }}>
          <Box css={{ font: 'heading' }}>Spackle is in private beta </Box>
          <Box css={{ marginY: 'small' }}>
            If you have an invite token, enter it below:
          </Box>
          <Box css={{ stack: 'x', gapX: 'small' }}>
            <TextField
              placeholder="Invite Token"
              onChange={(e) => setInviteToken(e.target.value)}
            />
            <Button
              disabled={!inviteToken || acceptInvite.isLoading}
              onPress={() => acceptInvite.mutate({ token: inviteToken })}
            >
              Submit
            </Button>
          </Box>
          {acceptInvite.error && (
            <Box css={{ font: 'caption', color: 'critical', marginY: 'small' }}>
              {(acceptInvite.error as any).message}
            </Box>
          )}
        </Box>
        <Divider />
        <Box
          css={{
            stack: 'y',
            paddingY: 'medium',
            gapY: 'small',
            marginY: 'medium',
          }}
        >
          <Box css={{ fontWeight: 'bold' }}>Request Access</Box>
          {account.wait_list_entries.length ? (
            <Box
              css={{
                stack: 'x',
                gapX: 'small',
                alignX: 'center',
                marginY: 'large',
              }}
            >
              <Icon name="check" css={{ fill: 'success' }} />
              <Box>You&apos;re on the list</Box>
            </Box>
          ) : (
            <Box>
              <Box css={{ stack: 'x', gapX: 'small' }}>
                <TextField
                  placeholder="jane@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  disabled={!email || requestAccess.isLoading}
                  onPress={() =>
                    requestAccess.mutate({
                      user_email: email,
                    })
                  }
                >
                  Submit
                </Button>
              </Box>
              {requestAccess.error && (
                <Box
                  css={{ font: 'caption', color: 'critical', marginY: 'small' }}
                >
                  {(requestAccess.error as any).message}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

const SetupInterstitial = ({ account }: { account: any }) => {
  const { post } = useApi()

  const acknowledgeSetup = useMutation(async () => {
    const response = await post('api/stripe/acknowledge_setup', {})

    if (response.status !== 200) {
      const error = (await response.json()).error
      throw new Error(error)
    }

    queryClient.invalidateQueries(['account', account.stripe_id])
    return response
  })

  return (
    <Box
      css={{
        width: 'fill',
        height: 'fill',
        gap: 'small',
      }}
    >
      <Box css={{ paddingX: 'large', font: 'heading', marginTop: 'xxlarge' }}>
        Setup
      </Box>
      <Box css={{ paddingX: 'large', marginY: 'small' }}>
        Before we begin, Spackle will need to sync all of your current products,
        subscriptions, and customers. This can take a few minutes.
      </Box>
      <Box css={{ stack: 'x', alignX: 'center', marginY: 'medium' }}>
        <Button
          type="primary"
          onPress={() => acknowledgeSetup.mutate()}
          disabled={acknowledgeSetup.isLoading}
        >
          Continue
        </Button>
      </Box>
    </Box>
  )
}

const AccountWrapper = ({ children }: { children: ReactNode }) => {
  const { post } = useApi()
  const { userContext } = useStripeContext()
  const {
    data: account,
    refetch,
    isLoading,
  } = useAccount(userContext.account.id)

  const startSync = useCallback(async () => {
    await post('api/stripe/sync_account', {})
  }, [post])

  const pollAccount = useCallback(async (): Promise<boolean> => {
    await delay(3000)
    const { data } = await refetch()

    if (data.initial_sync_complete) {
      return true
    } else if (!data.initial_sync_started_at) {
      await startSync()
    } else {
      const diff =
        (new Date() as unknown as number) -
        (new Date(data.initial_sync_started_at) as unknown as number)
      if (diff > 15 * 60 * 1000) {
        await startSync()
      }
    }

    return await pollAccount()
  }, [refetch, startSync])

  useEffect(() => {
    if (!account || !account.invite_id || !account.has_acknowledged_setup) {
      return
    }

    if (!account.initial_sync_started_at) {
      startSync()
      pollAccount()
    } else if (!account.initial_sync_complete) {
      pollAccount()
    }
  }, [account, pollAccount, startSync])

  if (isLoading) {
    return <LoadingSpinner />
  } else if (!account.invite_id) {
    return <InviteInterstitial account={account} />
  } else if (!account.has_acknowledged_setup) {
    return <SetupInterstitial account={account} />
  } else if (!account.initial_sync_complete) {
    return <LoadingSpinner>Running initial setup...</LoadingSpinner>
  } else {
    return <>{children}</>
  }
}

export default AccountWrapper
