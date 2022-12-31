import {
  Box,
  Button,
  Icon,
  Link,
  Spinner,
  TextField,
} from '@stripe/ui-extension-sdk/ui'
import { clipboardWriteText, showToast } from '@stripe/ui-extension-sdk/utils'
import useStripeContext from '../hooks/useStripeContext'
import useToken from '../hooks/useToken'

const SettingsView = () => {
  const { userContext } = useStripeContext()
  const { data } = useToken(userContext?.account.id)

  return (
    <Box
      css={{
        height: 'fill',
        width: 'fill',
        padding: 'small',
      }}
    >
      <Box>
        Use the access token below to request feature access flags via the
        Spackle API.
      </Box>
      <Box css={{ stack: 'x', gapX: 'small', marginBottom: 'medium' }}>
        For more information:
        <Link
          href="https://www.spackle.so/docs"
          type="primary"
          target="_blank"
          external
        >
          Read the Docs
        </Link>
      </Box>
      <Box
        css={{
          stack: 'x',
          gap: 'small',
          alignY: 'bottom',
          marginTop: 'large',
        }}
      >
        {data?.token ? (
          <>
            <TextField
              disabled
              value={data?.token || ''}
              label="Access Token"
            />
            <Button
              onPress={async () => {
                await clipboardWriteText(data.token)
                showToast('Copied!', { type: 'success' })
              }}
            >
              <Icon name="clipboard" />
            </Button>
          </>
        ) : (
          <Spinner />
        )}
      </Box>
    </Box>
  )
}

export default SettingsView
