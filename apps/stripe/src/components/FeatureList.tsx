import { Box, Button, Divider, Spinner } from '@stripe/ui-extension-sdk/ui'
import { Feature, NewOverride, Override } from '../types'
import FeatureValue from './FeatureValue'
import { useState, useEffect } from 'react'
import { QueryObserverResult, UseMutationResult } from '@tanstack/react-query'

const FeatureList = ({
  features,
  overrides,
  saveOverrides,
}: {
  features: QueryObserverResult<Feature[]>
  overrides: QueryObserverResult<Override[] | NewOverride[]>
  saveOverrides: UseMutationResult<any, unknown, Override[] | NewOverride[]>
}) => {
  const [overrideMap, setOverrideMap] = useState<{
    [key: number]: Override | NewOverride
  }>({})

  const isModified =
    JSON.stringify(overrides.data) !==
    JSON.stringify(Object.values(overrideMap))
  const isLoading =
    features.isRefetching || overrides.isRefetching || saveOverrides.isLoading

  useEffect(() => {
    if (overrides.data) {
      setOverrideMap(
        Object.assign(
          {},
          ...overrides.data.map((o) => ({ [o.feature_id]: o })),
        ),
      )
    }
  }, [overrides.data])

  if (!features.data || !overrides.data) {
    return <></>
  }

  return (
    <>
      <Box css={{ stack: 'y' }}>
        {features.data.map((f) => (
          <>
            <FeatureItem
              key={f.key}
              feature={f}
              overrideMap={overrideMap}
              setOverrideMap={setOverrideMap}
            />
            <Divider />
          </>
        ))}
      </Box>

      <Box css={{ stack: 'x', marginY: 'large', gap: 'small', alignX: 'end' }}>
        {!saveOverrides.isLoading && (
          <Button
            type="secondary"
            disabled={!isModified || isLoading}
            onPress={() => {
              setOverrideMap(
                Object.assign(
                  {},
                  ...overrides.data.map((o) => ({ [o.feature_id]: o })),
                ),
              )
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          type="primary"
          disabled={!isModified || isLoading}
          onPress={() => saveOverrides.mutate(Object.values(overrideMap))}
        >
          {saveOverrides.isLoading ? <Spinner /> : <>Save</>}
        </Button>
      </Box>
    </>
  )
}

const FeatureItem = ({
  feature,
  overrideMap,
  setOverrideMap,
}: {
  feature: Feature
  overrideMap: { [key: number]: Override | NewOverride }
  setOverrideMap: (map: { [key: number]: Override | NewOverride }) => void
}) => {
  return (
    <Box
      css={{
        stack: 'x',
        distribute: 'space-between',
        padding: 'small',
        alignY: 'center',
        gap: 'medium',
      }}
    >
      <Box css={{ width: '3/5', stack: 'y', gapY: 'small' }}>
        <Box css={{ fontWeight: 'semibold' }}>{feature.name}</Box>
        <Box css={{ font: 'caption', color: 'secondary' }}>{feature.key}</Box>
      </Box>
      <Box css={{ width: '2/5' }}>
        <FeatureValue
          feature={feature}
          override={overrideMap[feature.id]}
          setOverride={(o) => {
            if (o) {
              setOverrideMap({ ...overrideMap, [feature.id]: o })
            } else {
              const oMap = { ...overrideMap }
              delete oMap[feature.id]
              setOverrideMap(oMap)
            }
          }}
        />
      </Box>
    </Box>
  )
}

export default FeatureList
