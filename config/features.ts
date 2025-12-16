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
  | 'demoMode'

const prdMode = process.env.NEXT_PUBLIC_PRD_MODE !== 'false'

// Extra capabilities stay hidden in PRD mode unless explicitly enabled.
const featureDefaults: Record<FeatureKey, boolean> = {
  adminExtras: true,
  boardView: true,
  notificationFeed: true,
  productivityWidgets: true,
  appearanceSettings: false,
  integrations: true,
  userSwitcher: true,
  themeToggle: false,
  keyboardShortcuts: true,
  // Hide demo controls by default; opt-in via NEXT_PUBLIC_ENABLE_DEMOMODE.
  demoMode: false,
}

export function isFeatureEnabled(key: FeatureKey) {
  // Dark mode is disabled across the app.
  if (key === 'themeToggle') {
    return false
  }

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










