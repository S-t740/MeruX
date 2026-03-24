"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Awards reputation points to a user for their platform contributions.
 */
export async function awardReputation(userId: string, points: number, reason: string) {
    if (!userId || !points) return { error: "Missing required fields" };

    try {
        // Log the reputation event
        const { error: eventError } = await supabase.from('reputation_events').insert({
            user_id: userId,
            points: points,
            reason: reason
        });

        if (eventError) throw eventError;

        // Update the user's total reputation score
        const { data: currentRep } = await supabase
            .from('user_reputation')
            .select('score')
            .eq('user_id', userId)
            .single();

        const newScore = (currentRep?.score || 0) + points;
        let rankTier = "Observer";

        if (newScore > 50) rankTier = "Contributor";
        if (newScore > 200) rankTier = "Innovator";
        if (newScore > 500) rankTier = "Expert";
        if (newScore > 1000) rankTier = "Master";

        const { error: updateError } = await supabase
            .from('user_reputation')
            .upsert({
                user_id: userId,
                score: newScore,
                rank_tier: rankTier,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (updateError) throw updateError;

        return { success: true, newScore, rankTier };
    } catch (error: any) {
        console.error("Failed to award reputation:", error);
        return { error: error.message };
    }
}
