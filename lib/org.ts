import { prisma } from '@/lib/prisma'

function normalizeSlugValue(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) // keep slugs short for URLs
  return base || 'workspace'
}

/**
 * Create a URL-safe slug and ensure uniqueness by appending a counter when needed.
 */
export async function generateUniqueOrgSlug(name: string): Promise<string> {
  const baseSlug = normalizeSlugValue(name)
  let slug = baseSlug
  let counter = 2

  while (true) {
    const existing = await prisma.organization.findUnique({ where: { slug } })
    if (!existing) return slug

    slug = `${baseSlug}-${counter}`
    counter += 1
  }
}
