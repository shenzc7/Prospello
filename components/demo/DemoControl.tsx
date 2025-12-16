'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Users, Check, MonitorPlay } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDemo } from '@/components/demo/DemoContext'

export function DemoControl() {
    const { isEnabled, role, toggleDemo, setRole } = useDemo()

    // Floating "Pill" Design
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            <AnimatePresence>
                {isEnabled && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="flex items-center gap-2 rounded-full border border-border/50 bg-background/80 p-1.5 pl-4 shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
                    >
                        <div className="flex flex-col text-xs">
                            <span className="font-semibold text-foreground">Demo Active</span>
                            <span className="text-muted-foreground capitalize">{role.toLowerCase()} View</span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 hover:bg-muted/50">
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Switch Persona</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setRole('ADMIN')}>
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Admin / CEO</span>
                                    {role === 'ADMIN' && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setRole('MANAGER')}>
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Manager (VP Eng)</span>
                                    {role === 'MANAGER' && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setRole('EMPLOYEE')}>
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Employee (PM)</span>
                                    {role === 'EMPLOYEE' && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 rounded-full bg-red-500 hover:bg-red-600 text-white border-0"
                            onClick={toggleDemo}
                        >
                            Exit
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isEnabled && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        onClick={toggleDemo}
                        className="h-10 rounded-full shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:from-indigo-600 hover:to-purple-700"
                    >
                        <MonitorPlay className="mr-2 h-4 w-4" />
                        Try Demo
                    </Button>
                </motion.div>
            )}
        </div>
    )
}
