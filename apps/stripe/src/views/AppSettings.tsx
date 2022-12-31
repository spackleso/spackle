import { ExtensionContextValue } from '@stripe/ui-extension-sdk/context'
import { QueryClientProvider } from '@tanstack/react-query'
import { ApiContext, createApi } from '../hooks/useApi'
import { StripeContext } from '../hooks/useStripeContext'
import { queryClient } from '../query'
import SettingsView from '../components/SettingsView'

const AppSettings = (context: ExtensionContextValue) => {
  return (
    <QueryClientProvider client={queryClient}>
      {context.userContext && (
        <StripeContext.Provider value={context}>
          <ApiContext.Provider value={createApi(context)}>
            <SettingsView />
          </ApiContext.Provider>
        </StripeContext.Provider>
      )}
    </QueryClientProvider>
  )
}

export default AppSettings
