import { ExtensionContextValue } from '@stripe/ui-extension-sdk/context'
import { useContext, createContext } from 'react'

export const StripeContext = createContext<ExtensionContextValue | undefined>(
  undefined,
)

export const useStripeContext = () => {
  const context = useContext(StripeContext)
  if (context === undefined) {
    throw new Error(
      'useStripeContext must be used within a StripeContext.Provider',
    )
  }
  return context
}

export default useStripeContext
