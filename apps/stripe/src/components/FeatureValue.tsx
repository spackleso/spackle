import { Box, Link, Switch, TextField } from '@stripe/ui-extension-sdk/ui'
import { useEffect } from 'react'
import { Feature, FeatureType, NewOverride, Override } from '../types'

const FeatureValue = ({
  feature,
  override,
  setOverride,
}: {
  feature: Feature
  override: Override | NewOverride | undefined
  setOverride: (override: Override | NewOverride | undefined) => void
}) => {
  if (override) {
    return (
      <Box
        css={{
          stack: 'y',
          gapX: 'small',
          alignY: 'center',
          alignX: 'end',
          gapY: 'small',
        }}
      >
        {feature.type === FeatureType.Flag ? (
          <Switch
            checked={!!override.value_flag}
            onChange={(e) =>
              setOverride({
                ...override,
                value_flag: e.target.checked,
              })
            }
          ></Switch>
        ) : feature.type === FeatureType.Limit ? (
          <TextField
            type="number"
            value={override.value_limit || 0}
            onChange={(e) =>
              setOverride({
                ...override,
                value_limit: parseInt(e.target.value),
              })
            }
          ></TextField>
        ) : (
          <></>
        )}

        <Box css={{ font: 'caption' }}>
          <Link type="secondary" onPress={() => setOverride(undefined)}>
            Reset to Default
          </Link>
        </Box>
      </Box>
    )
  } else {
    return (
      <Box
        css={{
          stack: 'y',
          gapX: 'small',
          alignY: 'center',
          alignX: 'end',
          gapY: 'small',
        }}
      >
        {feature.type === FeatureType.Flag ? (
          <>{feature.value_flag ? <Box>Enabled</Box> : <Box>Disabled</Box>}</>
        ) : feature.type === FeatureType.Limit ? (
          <Box>{feature.value_limit}</Box>
        ) : (
          <></>
        )}
        <Box css={{ font: 'caption' }}>
          <Link
            type="primary"
            onPress={() =>
              setOverride({
                feature_id: feature.id,
                value_flag:
                  feature.type === FeatureType.Flag ? feature.value_flag : null,
                value_limit:
                  feature.type === FeatureType.Limit
                    ? feature.value_limit
                    : null,
              })
            }
          >
            Override
          </Link>
        </Box>
      </Box>
    )
  }
}

export default FeatureValue
