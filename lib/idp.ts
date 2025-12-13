import GoogleProvider from 'next-auth/providers/google'
import SlackProvider from 'next-auth/providers/slack'
import AzureADProvider from 'next-auth/providers/azure-ad'
import type { NextAuthOptions } from 'next-auth'
import { prisma } from '@/lib/prisma'

type ProviderType = 'google' | 'slack' | 'azure-ad' | 'oidc'
type Provider = NextAuthOptions['providers'][number]

export async function loadTenantProviders(orgSlug?: string): Promise<Provider[]> {
  if (!orgSlug) return []

  let configs
  try {
    configs = await prisma.identityProviderConfig.findMany({
      where: { org: { slug: orgSlug } },
    })
  } catch (error) {
    console.warn('loadTenantProviders failed; falling back to base providers', error)
    return []
  }

  return configs
    .map((config) => providerFromConfig(
      config.provider as ProviderType, 
      config.clientId, 
      config.clientSecret, 
      {
        issuer: config.issuer || undefined,
        tenantId: config.tenantId || undefined,
        orgSlug, // Pass orgSlug to make provider IDs unique
      }
    ))
    .filter(Boolean) as Provider[]
}

function providerFromConfig(
  provider: ProviderType,
  clientId: string,
  clientSecret: string,
  options?: { issuer?: string; tenantId?: string; orgSlug?: string }
): Provider | null {
  // Make provider IDs slug-specific to avoid conflicts between tenants
  const providerId = options?.orgSlug ? `${provider}-${options.orgSlug}` : provider

  if (provider === 'google') {
    return GoogleProvider({
      id: providerId,
      clientId,
      clientSecret,
    })
  }

  if (provider === 'slack') {
    return SlackProvider({
      id: providerId,
      clientId,
      clientSecret,
    })
  }

  if (provider === 'azure-ad') {
    return AzureADProvider({
      id: providerId,
      clientId,
      clientSecret,
      tenantId: options?.tenantId,
    })
  }

  if (provider === 'oidc' && options?.issuer) {
    // Generic OIDC provider - using type assertion for NextAuth compatibility
    const oidcProvider = {
      id: providerId,
      name: `OIDC (${options.orgSlug || 'default'})`,
      type: 'oidc' as const,
      issuer: options.issuer,
      clientId,
      clientSecret,
      profile(profile: { sub?: string; email?: string; name?: string }) {
        return {
          id: profile.sub ?? '',
          name: profile.name ?? profile.email ?? 'User',
          email: profile.email ?? '',
        }
      },
    }
    return oidcProvider as unknown as Provider
  }

  return null
}
