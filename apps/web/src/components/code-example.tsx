'use client'

import { Highlight, themes } from 'prism-react-renderer'

const pythonCode = `
customer = spackle.Customer.retrieve('cus_000000000')
if customer.enabled('landing_pages'):
    print('Landing pages enabled!')
`

const theme = themes.oneDark
theme.plain.backgroundColor = 'rgba(0, 0, 0, 0)'

const CodeExample = () => {
  return (
    <Highlight code={pythonCode.trim()} language="python" theme={theme}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}

export default CodeExample
