#!/usr/bin/env node

/**
 * Pre-warms all routes by making requests to compile them
 * Run this after starting the dev server
 */

const routes = [
  '/login',
  '/',
  '/teams',
  '/my-okrs',
  '/settings',
  '/reports',
  '/checkins',
  '/admin',
  '/api/auth/session',
  '/api/objectives',
]

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function warmup() {
  console.log('🔥 Warming up routes...\n')
  
  for (const route of routes) {
    const url = `${BASE_URL}${route}`
    const start = Date.now()
    
    try {
      const res = await fetch(url, { 
        redirect: 'manual',
        headers: { 'Accept': 'text/html' }
      })
      const time = Date.now() - start
      const status = res.status
      console.log(`  ✓ ${route} (${status}) - ${time}ms`)
    } catch (err) {
      const time = Date.now() - start
      console.log(`  ✗ ${route} - ${time}ms (${err.message})`)
    }
  }
  
  console.log('\n✅ All routes warmed up! Navigation should be fast now.\n')
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 30) {
  console.log(`⏳ Waiting for server at ${BASE_URL}...`)
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await fetch(`${BASE_URL}/api/auth/session`, { redirect: 'manual' })
      console.log('✓ Server is ready!\n')
      return true
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  
  console.log('✗ Server not responding after 30 seconds')
  return false
}

async function main() {
  const ready = await waitForServer()
  if (ready) {
    await warmup()
  }
}

main()














