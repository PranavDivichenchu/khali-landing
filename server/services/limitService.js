/**
 * LimitService - Tracks and enforces daily API usage limits
 */
const dbService = require('./dbService');

class LimitService {
    /**
     * Check if we are under the daily limit for a service
     * @param {string} serviceName - Service identifier (e.g., 'newsmesh')
     * @param {number} limit - Daily limit
     * @returns {Promise<boolean>} - true if under limit
     */
    async checkLimit(serviceName, limit) {
        if (!dbService.supabase) {
            console.warn('[LimitService] No Supabase - allowing request');
            return true;
        }

        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await dbService.supabase
            .from('api_usage')
            .select('count')
            .eq('service', serviceName)
            .eq('date', today)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[LimitService] Error checking limit:', error.message);
            return true; // Allow on error to not block ingestion
        }

        const currentCount = data?.count || 0;
        const isUnderLimit = currentCount < limit;

        if (!isUnderLimit) {
            console.log(`[LimitService] Daily limit reached for ${serviceName}: ${currentCount}/${limit}`);
        }

        return isUnderLimit;
    }

    /**
     * Increment the usage count for a service
     * @param {string} serviceName - Service identifier
     * @param {number} count - Number of calls to add (default 1)
     */
    async incrementUsage(serviceName, count = 1) {
        if (!dbService.supabase || count === 0) return;

        const today = new Date().toISOString().split('T')[0];

        try {
            // Try to get current count
            const { data: existing } = await dbService.supabase
                .from('api_usage')
                .select('count')
                .eq('service', serviceName)
                .eq('date', today)
                .single();

            const currentCount = existing?.count || 0;
            const newCount = currentCount + count;

            // Upsert the new count
            const { error } = await dbService.supabase
                .from('api_usage')
                .upsert({
                    service: serviceName,
                    date: today,
                    count: newCount,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'service,date' });

            if (error) {
                console.error('[LimitService] Error incrementing usage:', error.message);
            } else {
                console.log(`[LimitService] ${serviceName} usage: ${currentCount} -> ${newCount}`);
            }
        } catch (err) {
            console.error('[LimitService] incrementUsage failed:', err.message);
        }
    }

    /**
     * Get current usage for a service
     * @param {string} serviceName - Service identifier
     * @returns {Promise<number>} - Current count for today
     */
    async getCurrentUsage(serviceName) {
        if (!dbService.supabase) return 0;

        const today = new Date().toISOString().split('T')[0];

        const { data } = await dbService.supabase
            .from('api_usage')
            .select('count')
            .eq('service', serviceName)
            .eq('date', today)
            .single();

        return data?.count || 0;
    }
}

module.exports = new LimitService();
