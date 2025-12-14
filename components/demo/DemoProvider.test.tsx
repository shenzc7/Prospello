'use client'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DemoProvider, useDemoMode } from '@/components/demo/DemoProvider'

function DemoConsumer() {
  const { enabled, startDemo, stopDemo } = useDemoMode()

  return (
    <div>
      <span data-testid="demo-status">{enabled ? 'enabled' : 'disabled'}</span>
      <button type="button" onClick={() => startDemo('ADMIN')}>
        start
      </button>
      <button type="button" onClick={stopDemo}>
        stop
      </button>
    </div>
  )
}

describe('DemoProvider', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_DEMOMODE = 'true'
  })

  it('toggles demo mode when calling startDemo and stopDemo', async () => {
    const user = userEvent.setup()

    render(
      <DemoProvider>
        <DemoConsumer />
      </DemoProvider>
    )

    expect(screen.getByTestId('demo-status')).toHaveTextContent('disabled')

    await user.click(screen.getByRole('button', { name: /start/i }))
    expect(screen.getByTestId('demo-status')).toHaveTextContent('enabled')

    await user.click(screen.getByRole('button', { name: /stop/i }))
    expect(screen.getByTestId('demo-status')).toHaveTextContent('disabled')
  })
})

