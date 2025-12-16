'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type DemoRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'

type DemoContextType = {
    isEnabled: boolean
    role: DemoRole
    toggleDemo: () => void
    setRole: (role: DemoRole) => void
}

const DemoContext = createContext<DemoContextType | null>(null)

export function DemoProvider({ children }: { children: React.ReactNode }) {
    const [isEnabled, setIsEnabled] = useState(false)
    const [role, setRole] = useState<DemoRole>('ADMIN')

    // Persist state lightly
    useEffect(() => {
        const stored = localStorage.getItem('okrflow_demo_mode')
        if (stored === 'true') setIsEnabled(true)

        const storedRole = localStorage.getItem('okrflow_demo_role') as DemoRole
        if (storedRole) setRole(storedRole)
    }, [])

    const toggleDemo = () => {
        const newState = !isEnabled
        setIsEnabled(newState)
        localStorage.setItem('okrflow_demo_mode', String(newState))
        if (!newState) {
            // Clear specific demo cookies if needed, or just rely on state
            document.cookie = 'demo_mode=; Max-Age=0'
        }
    }

    const updateRole = (newRole: DemoRole) => {
        setRole(newRole)
        localStorage.setItem('okrflow_demo_role', newRole)
    }

    return (
        <DemoContext.Provider value={{ isEnabled, role, toggleDemo, setRole: updateRole }}>
            {children}
        </DemoContext.Provider>
    )
}

export function useDemo() {
    const context = useContext(DemoContext)
    if (!context) throw new Error('useDemo must be used within a DemoProvider')
    return context
}
