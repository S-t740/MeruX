"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AlertTriangle, Clock } from "lucide-react"

// Configuration
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
const WARNING_WINDOW_MS = 60 * 1000 // 1 minute before timeout to show warning

export function SessionSecurityProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [showWarning, setShowWarning] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState(60)
    
    const lastActivityTime = useRef(Date.now())
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const warningIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Check if user is on an auth or public page where tracking is not needed
    const isPublicOrAuthPage = pathname === '/' || 
                               pathname.startsWith('/login') || 
                               pathname.startsWith('/register') || 
                               pathname.startsWith('/forgot-password')

    const resetTimer = useCallback(() => {
        lastActivityTime.current = Date.now()
        if (showWarning) {
            setShowWarning(false)
        }
    }, [showWarning])

    const handleLogout = useCallback(async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login?reason=timeout')
        } catch (error) {
            console.error("Auto-logout failed", error)
            // Force redirect anyway
            router.push('/login?reason=timeout')
        }
    }, [router, supabase])

    useEffect(() => {
        // Only run inactivity logic if authenticated
        const checkAuth = async () => {
            const { data } = await supabase.auth.getSession()
            setIsAuthenticated(!!data.session)
        }
        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setIsAuthenticated(!!session)
            // If another tab logs out, redirect immediately
            if (event === 'SIGNED_OUT') {
                router.push('/login')
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase, router])

    useEffect(() => {
        if (!isAuthenticated || isPublicOrAuthPage) return

        const trackActivity = () => {
            resetTimer()
        }

        // Set up event listeners for user activity
        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll']
        events.forEach(event => window.addEventListener(event, trackActivity, { passive: true }))

        // Start checking idle time
        const checkIdleTime = () => {
            const now = Date.now()
            const idleTime = now - lastActivityTime.current

            if (idleTime >= INACTIVITY_TIMEOUT_MS) {
                handleLogout()
            } else if (idleTime >= INACTIVITY_TIMEOUT_MS - WARNING_WINDOW_MS) {
                setShowWarning(true)
                setTimeRemaining(Math.ceil((INACTIVITY_TIMEOUT_MS - idleTime) / 1000))
            } else {
                setShowWarning(false)
            }
        }

        timeoutRef.current = setInterval(checkIdleTime, 1000)

        return () => {
            events.forEach(event => window.removeEventListener(event, trackActivity))
            if (timeoutRef.current) clearInterval(timeoutRef.current)
        }
    }, [isAuthenticated, isPublicOrAuthPage, resetTimer, handleLogout])

    return (
        <>
            {children}
            
            {showWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-card border border-hub-rose/30 shadow-2xl shadow-hub-rose/20 rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-hub-rose/10 flex items-center justify-center mb-2">
                            <Clock className="w-8 h-8 text-hub-rose animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-outfit font-bold text-foreground">Inactivity Warning</h2>
                        <p className="text-sm text-muted-foreground">
                            You have been inactive for a while. For your security, you will be logged out in <span className="font-bold text-hub-rose">{timeRemaining} seconds</span>.
                        </p>
                        
                        <div className="flex gap-3 w-full mt-4 pt-4">
                            <button 
                                onClick={handleLogout}
                                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold border border-border hover:bg-accent transition-colors"
                            >
                                Log Out Now
                            </button>
                            <button 
                                onClick={resetTimer}
                                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-hub-indigo text-white hover:bg-hub-indigo/90 shadow-lg shadow-hub-indigo/20 transition-all"
                            >
                                Stay Logged In
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
