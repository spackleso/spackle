import { Fragment } from 'react'
import Highlight, { defaultProps } from 'prism-react-renderer'

const djangoPricingTableTemplate = `
<!-- myapp/templates/pricing_table.html -->
<table>
  <thead>
    <tr>
      <th>Feature</th>
      {% for interval in pricing_table.intervals %}
        <th>{{ interval }}</th>
      {% endfor %}
    </tr>
  </thead>
  <tbody>
    {% for product in pricing_table.products %}
      <tr>
        <td>{{ product.name }}</td>
        {% for interval in pricing_table.intervals %}
          <td>
            {{ product.prices[interval].unit_amount }} {{ product.prices[interval].currency }}
          </td>
        {% endfor %}
      </tr>
    {% endfor %}
  </tbody>
</table>
`

export function Fence(props: any) {
  const { children, language } = props
  if (language === 'django-pricing-table') {
    return (
      <pre>
        <code>
          <Fragment>{djangoPricingTableTemplate.trim()}</Fragment>
        </code>
      </pre>
    )
  }

  return (
    <Highlight
      {...defaultProps}
      code={children.trimEnd()}
      language={language}
      theme={undefined}
    >
      {({ className, style, tokens, getTokenProps }) => (
        <pre className={className} style={style}>
          <code>
            {tokens.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {line
                  .filter((token) => !token.empty)
                  .map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                {'\n'}
              </Fragment>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  )
}
