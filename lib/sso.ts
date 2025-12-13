// =============================================================================
// SSO / SINGLE SIGN-ON CONFIGURATION
// =============================================================================
// OKRFlow supports multiple SSO providers out of the box:
// - Google Workspace
// - Slack
// - Microsoft Azure AD (Entra ID)
//
// SSO is OPTIONAL. Without it, users can still sign up with email/password.
// When configured, SSO buttons appear on the login/signup pages automatically.
//
// To enable a provider, set its CLIENT_ID and CLIENT_SECRET in .env
// See the .env file for detailed setup instructions for each provider.
// =============================================================================

export type SsoProviderType = 'google' | 'slack' | 'azure-ad'

export interface SsoProviderConfig {
  id: SsoProviderType
  name: string
  configured: boolean
  requiredEnvVars: string[]
  setupUrl: string
  description: string
}

/**
 * Check if a specific SSO provider is configured
 */
export function isSsoProviderConfigured(provider: SsoProviderType): boolean {
  switch (provider) {
    case 'google':
      return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    case 'slack':
      return !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET)
    case 'azure-ad':
      return !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET)
    default:
      return false
  }
}

/**
 * Check if any SSO provider is configured
 */
export function isAnySsoConfigured(): boolean {
  return (
    isSsoProviderConfigured('google') ||
    isSsoProviderConfigured('slack') ||
    isSsoProviderConfigured('azure-ad')
  )
}

/**
 * Check if password authentication is enabled
 */
export function isPasswordAuthEnabled(): boolean {
  return process.env.ALLOW_PASSWORD_AUTH !== 'false'
}

/**
 * Check if SSO is required (password auth disabled)
 */
export function isSsoRequired(): boolean {
  return process.env.REQUIRE_SSO === 'true'
}

/**
 * Get list of all SSO providers with their configuration status
 */
export function getSsoProviders(): SsoProviderConfig[] {
  return [
    {
      id: 'google',
      name: 'Google',
      configured: isSsoProviderConfigured('google'),
      requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      setupUrl: 'https://console.cloud.google.com/apis/credentials',
      description: 'Sign in with Google Workspace or personal Gmail accounts',
    },
    {
      id: 'slack',
      name: 'Slack',
      configured: isSsoProviderConfigured('slack'),
      requiredEnvVars: ['SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET'],
      setupUrl: 'https://api.slack.com/apps',
      description: 'Sign in with Slack workspace accounts',
    },
    {
      id: 'azure-ad',
      name: 'Microsoft',
      configured: isSsoProviderConfigured('azure-ad'),
      requiredEnvVars: ['AZURE_AD_CLIENT_ID', 'AZURE_AD_CLIENT_SECRET', 'AZURE_AD_TENANT_ID'],
      setupUrl: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
      description: 'Sign in with Microsoft 365 / Azure AD (Entra ID) accounts',
    },
  ]
}

/**
 * Get configured SSO providers only
 */
export function getConfiguredSsoProviders(): SsoProviderConfig[] {
  return getSsoProviders().filter((p) => p.configured)
}

/**
 * Get SSO configuration summary for debugging/admin
 */
export function getSsoConfigSummary(): {
  passwordAuthEnabled: boolean
  ssoRequired: boolean
  configuredProviders: string[]
  unconfiguredProviders: string[]
} {
  const providers = getSsoProviders()
  return {
    passwordAuthEnabled: isPasswordAuthEnabled(),
    ssoRequired: isSsoRequired(),
    configuredProviders: providers.filter((p) => p.configured).map((p) => p.name),
    unconfiguredProviders: providers.filter((p) => !p.configured).map((p) => p.name),
  }
}

// =============================================================================
// SSO SETUP GUIDES
// =============================================================================
// Detailed setup instructions for each provider. These can be displayed in
// an admin UI or documentation.
// =============================================================================

export const ssoSetupGuides = {
  google: {
    title: 'Google OAuth Setup',
    steps: [
      'Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials',
      'Create a new project or select an existing one',
      'Go to "APIs & Services" → "Credentials"',
      'Click "Create Credentials" → "OAuth client ID"',
      'Select "Web application" as the application type',
      'Add authorized redirect URI: {NEXTAUTH_URL}/api/auth/callback/google',
      'Copy the Client ID and Client Secret to your .env file',
    ],
    envExample: `GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"`,
  },
  slack: {
    title: 'Slack OAuth Setup',
    steps: [
      'Go to Slack API: https://api.slack.com/apps',
      'Click "Create New App" → "From scratch"',
      'Enter app name and select your workspace',
      'Go to "OAuth & Permissions" in the sidebar',
      'Add redirect URL: {NEXTAUTH_URL}/api/auth/callback/slack',
      'Under "Scopes", add: identity.basic, identity.email, identity.avatar',
      'Install the app to your workspace',
      'Copy Client ID and Client Secret to your .env file',
    ],
    envExample: `SLACK_CLIENT_ID="123456789.987654321"
SLACK_CLIENT_SECRET="abcdef123456789"`,
  },
  'azure-ad': {
    title: 'Microsoft Azure AD Setup',
    steps: [
      'Go to Azure Portal: https://portal.azure.com',
      'Navigate to "Azure Active Directory" → "App registrations"',
      'Click "New registration"',
      'Enter app name, select "Accounts in this organizational directory only"',
      'Add redirect URI: {NEXTAUTH_URL}/api/auth/callback/azure-ad',
      'Go to "Certificates & secrets" → "New client secret"',
      'Copy the Application (client) ID, Directory (tenant) ID, and secret value',
    ],
    envExample: `AZURE_AD_CLIENT_ID="12345678-1234-1234-1234-123456789abc"
AZURE_AD_CLIENT_SECRET="abc~xxxxxxxxxxxxx"
AZURE_AD_TENANT_ID="12345678-1234-1234-1234-123456789abc"`,
  },
}

/**
 * Get setup guide for a specific provider
 */
export function getSsoSetupGuide(provider: SsoProviderType) {
  return ssoSetupGuides[provider]
}
