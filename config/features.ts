type FeatureKey =
  | 'adminExtras'
  | 'boardView'
  | 'notificationFeed'
  | 'productivityWidgets'
  | 'appearanceSettings'
  | 'integrations'
  | 'userSwitcher'
  | 'themeToggle'
  | 'keyboardShortcuts'

const prdMode = process.env.NEXT_PUBLIC_PRD_MODE !== 'false'

// Extra capabilities stay hidden in PRD mode unless explicitly enabled.
const featureDefaults: Record<FeatureKey, boolean> = {
  adminExtras: false,
  boardView: false,
  notificationFeed: false,
  productivityWidgets: false,
  appearanceSettings: false,
  integrations: false,
  userSwitcher: false,
  themeToggle: false,
  keyboardShortcuts: false,
}

export function isFeatureEnabled(key: FeatureKey) {
  // Allow selective opt-in when PRD mode is off or an override is provided.
  const envOverride = process.env[`NEXT_PUBLIC_ENABLE_${key.toUpperCase()}`]
  const allowOverride = envOverride === 'true'

  if (!prdMode) {
    return true
  }

  if (allowOverride) {
    return true
  }

  return featureDefaults[key]
}

export const featureFlags = {
  prdMode,
  isFeatureEnabled,
}
