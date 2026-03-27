"use client"

import { useEffect, useState } from "react"
import { getPendingApprovals, approveUser, rejectUser } from "@/lib/actions/approvals"
import { Shield, Check, X, Loader2, UserX, UserCheck, Search, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type PendingUser = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    created_at: string;
}

export default function AdminApprovalsPage() {
    const [users, setUsers] = useState<PendingUser[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const fetchUsers = async () => {
        setLoading(true)
        const { data, error } = await getPendingApprovals()
        if (error) {
            setError(error)
        } else if (data) {
            setUsers(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleApprove = async (id: string) => {
        setActionLoading(`approve-${id}`)
        const res = await approveUser(id)
        if (res.success) {
            setUsers(users.filter(u => u.id !== id))
        } else {
            console.error(res.error)
            alert("Failed to approve user: " + res.error)
        }
        setActionLoading(null)
    }

    const handleReject = async (id: string) => {
        if (!confirm("Are you sure you want to reject this user? Their profile will be deleted.")) return;
        
        setActionLoading(`reject-${id}`)
        const res = await rejectUser(id)
        if (res.success) {
            setUsers(users.filter(u => u.id !== id))
        } else {
            console.error(res.error)
            alert("Failed to reject user: " + res.error)
        }
        setActionLoading(null)
    }

    return (
        <div className="space-y-8 animate-fade-in relative z-10 w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-amber/10 border border-hub-amber/20 text-hub-amber text-xs font-semibold mb-2">
                        <Shield className="w-3.5 h-3.5" /> Identity Verification
                    </div>
                    <h1 className="text-3xl font-outfit font-bold tracking-tight">Pending Approvals</h1>
                    <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
                        Review and approve accounts requesting elevated access privileges (Mentors and Instructors).
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Search by email..." 
                            className="bg-accent/50 border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-hub-indigo" />
                </div>
            ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center border border-border/50 rounded-2xl bg-card/30 backdrop-blur-xl">
                    <div className="w-16 h-16 rounded-2xl bg-accent/50 flex items-center justify-center mb-4">
                        <UserCheck className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold font-outfit mb-2">All Caught Up</h3>
                    <p className="text-muted-foreground max-w-sm">
                        There are no pending account approvals at this time.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {users.map(user => (
                        <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-card border border-border/50 hover:border-hub-indigo/30 transition-colors gap-6 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-hub-indigo to-hub-purple flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-hub-indigo/20">
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold flex items-center gap-2">
                                        {user.first_name} {user.last_name}
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                            user.role === 'instructor' ? 'bg-hub-rose/10 text-hub-rose border border-hub-rose/20' : 'bg-hub-teal/10 text-hub-teal border border-hub-teal/20'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" /> Requested {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => handleReject(user.id)}
                                    disabled={actionLoading !== null}
                                    className="flex-1 md:flex-none py-2 px-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {actionLoading === `reject-${user.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleApprove(user.id)}
                                    disabled={actionLoading !== null}
                                    className="flex-1 md:flex-none py-2 px-6 rounded-xl bg-hub-teal text-white hover:bg-hub-teal/90 shadow-lg shadow-hub-teal/20 transition-all text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {actionLoading === `approve-${user.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Approve Access
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
