import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/studio/join — Validate and join a session
// Checks: access type, code, capacity, enrollment, group membership
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { session_id, session_code, invite_token } = body;

        if (!session_id) {
            return NextResponse.json({ error: "session_id is required" }, { status: 400 });
        }

        // Fetch the session
        const { data: session, error: sessionError } = await supabase
            .from("learning_sessions")
            .select("*, host:profiles!host_id(full_name)")
            .eq("id", session_id)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Check session status
        if (session.status === "ended" || session.status === "cancelled") {
            return NextResponse.json({ error: "This session has ended", code: "SESSION_ENDED" }, { status: 410 });
        }

        // ─── Access validation by type ─────────────────────────────────────────
        switch (session.access_type) {
            case "code": {
                if (!session_code) {
                    return NextResponse.json({ error: "Session code required", code: "CODE_REQUIRED" }, { status: 403 });
                }
                if (session.session_code !== session_code.toUpperCase()) {
                    return NextResponse.json({ error: "Invalid session code", code: "INVALID_CODE" }, { status: 403 });
                }
                break;
            }
            case "invite": {
                if (!invite_token || session.invite_token !== invite_token) {
                    return NextResponse.json({ error: "Invalid invite link", code: "INVALID_INVITE" }, { status: 403 });
                }
                break;
            }
            case "enrollment": {
                if (!session.course_id) break;
                const { data: enrollment } = await supabase
                    .from("course_enrollments")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("course_id", session.course_id)
                    .single();

                if (!enrollment) {
                    // Check if user is admin/instructor/tutor (they bypass enrollment)
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", user.id)
                        .single();

                    const bypassRoles = ["instructor", "tutor", "admin", "super_admin"];
                    if (!profile || !bypassRoles.includes(profile.role)) {
                        return NextResponse.json({ error: "You must be enrolled in the course to join this session", code: "NOT_ENROLLED" }, { status: 403 });
                    }
                }
                break;
            }
            case "group": {
                if (!session.group_id) break;
                const { data: membership } = await supabase
                    .from("tutor_group_members")
                    .select("id")
                    .eq("group_id", session.group_id)
                    .eq("learner_id", user.id)
                    .single();

                if (!membership && session.host_id !== user.id) {
                    return NextResponse.json({ error: "This session is restricted to group members", code: "NOT_IN_GROUP" }, { status: 403 });
                }
                break;
            }
            case "open":
            default:
                // Open sessions — anyone authenticated can join
                break;
        }

        // ─── Capacity check ────────────────────────────────────────────────────
        if (session.max_participants) {
            const { count } = await supabase
                .from("session_participants")
                .select("id", { count: "exact", head: true })
                .eq("session_id", session_id)
                .is("left_at", null);

            if ((count ?? 0) >= session.max_participants && session.host_id !== user.id) {
                return NextResponse.json({ error: "Session is at capacity", code: "SESSION_FULL" }, { status: 403 });
            }
        }

        // ─── Record/update participant entry ───────────────────────────────────
        const { error: upsertError } = await supabase
            .from("session_participants")
            .upsert({
                session_id,
                user_id: user.id,
                joined_at: new Date().toISOString(),
                left_at: null,
                is_host: session.host_id === user.id,
            }, { onConflict: "session_id,user_id" });

        if (upsertError) {
            console.error("Failed to record participant:", upsertError.message);
        }

        return NextResponse.json({
            granted: true,
            session: {
                id: session.id,
                title: session.title,
                host_name: session.host?.full_name || "Host",
                status: session.status,
                is_recorded: session.is_recorded,
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
