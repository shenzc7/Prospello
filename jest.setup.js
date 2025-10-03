import '@testing-library/jest-dom'

// Mock Next.js server modules for testing
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
      headers: new Map(),
    })),
  },
}))

// Mock Next.js Request for testing
global.Request = class MockRequest {
  constructor(url) {
    this.url = url
  }
}

// Mock Next.js Response for testing
global.Response = class MockResponse {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.headers = new Map()
  }

  json() {
    return Promise.resolve(this.body)
  }
}
