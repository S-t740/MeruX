import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/studio/sessions — List sessions (filtered by status, host, course)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const hostId = searchParams.get("host_id");
        const courseId = searchParams.get("course_id");

        let query = supabase
            .from("learning_sessions")
            .select(`*, host:profiles!host_id(full_name, avatar_url)`)
            .order("scheduled_at", { ascending: false });

        if (status)   query = query.eq("status", status);
        if (hostId)   query = query.eq("host_id", hostId);
        if (courseId) query = query.eq("course_id", courseId);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ sessions: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/studio/sessions — Create a new session
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Check that the user has host permissions (tutor, instructor, admin)
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const hostRoles = ["tutor", "instructor", "admin", "super_admin"];
        if (!profile || !hostRoles.includes(profile.role)) {
            return NextResponse.json({ error: "Forbidden: only tutors and instructors can create sessions" }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, scheduled_at, course_id, group_id, access_type, max_participants, is_recorded } = body;

        if (!title || !scheduled_at) {
            return NextResponse.json({ error: "title and scheduled_at are required" }, { status: 400 });
        }

        // Generate a 6-character session code for code-based access
        const sessionCode = access_type === "code"
            ? Math.random().toString(36).slice(2, 8).toUpperCase()
            : null;

        const { data: session, error } = await supabase
            .from("learning_sessions")
            .insert({
                title,
                description: description || null,
                host_id: user.id,
                course_id: course_id || null,
                group_id: group_id || null,
                scheduled_at,
                status: "scheduled",
                access_type: access_type || "enrollment",
                session_code: sessionCode,
                max_participants: max_participants || 50,
                is_recorded: is_recorded !== false,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ session }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/studio/sessions — Update session status (start, end, cancel)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { session_id, status } = body;

        if (!session_id || !status) {
            return NextResponse.json({ error: "session_id and status are required" }, { status: 400 });
        }

        const validStatuses = ["live", "ended", "cancelled"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const update: Record<string, any> = { status };
        if (status === "live")   update.started_at = new Date().toISOString();
        if (status === "ended")  update.ended_at   = new Date().toISOString();

        const { data, error } = await supabase
            .from("learning_sessions")
            .update(update)
            .eq("id", session_id)
            .eq("host_id", user.id)  // Only host can update
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ session: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
