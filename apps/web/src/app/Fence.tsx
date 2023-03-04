'use client'

import { Fragment } from 'react'
import Highlight, { defaultProps } from 'prism-react-renderer'

export function Fence({ children, language }: any) {
  return (
    <Highlight
      {...defaultProps}
      code={children.trimEnd()}
      language={language}
      theme={undefined}
    >
      {({ className, style, tokens, getTokenProps }) => (
        <pre className={className + ' text-sm'} style={style}>
          <code>
            {tokens.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {line
                  .filter((token) => !token.empty)
                  .map((token, tokenIndex) => {
                    const { key, ...tokenProps } = getTokenProps({ token })
                    return <span key={tokenIndex} {...tokenProps} />
                  })}
                {'\n'}
              </Fragment>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  )
}
