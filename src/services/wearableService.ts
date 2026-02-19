import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeviceType = 'apple_watch' | 'fitbit' | 'garmin' | 'whoop' | 'oura' | 'samsung' | 'other';
export type DataType = 'heart_rate' | 'steps' | 'calories_burned' | 'sleep' | 'spo2' | 'hrv' | 'stress' | 'activity';

export interface WearableDataPoint {
    id?: string;
    deviceId: string;
    deviceType: DeviceType;
    dataType: DataType;
    rawValue: Record<string, unknown>;
    normalizedValue?: number;
    unit?: string;
    recordedAt: string;
}

export interface WearableDevice {
    deviceId: string;
    deviceType: DeviceType;
    lastSyncAt?: string;
}

// ─── Normalization Pipeline ───────────────────────────────────────────────────

function normalizeDataPoint(dataType: DataType, rawValue: Record<string, unknown>): { value: number; unit: string } {
    switch (dataType) {
        case 'heart_rate':
            return { value: Number(rawValue.bpm) || 0, unit: 'bpm' };
        case 'steps':
            return { value: Number(rawValue.count) || 0, unit: 'steps' };
        case 'calories_burned':
            return { value: Number(rawValue.kcal) || 0, unit: 'kcal' };
        case 'sleep':
            return { value: Number(rawValue.hours) || 0, unit: 'hours' };
        case 'spo2':
            return { value: Number(rawValue.percentage) || 0, unit: '%' };
        case 'hrv':
            return { value: Number(rawValue.ms) || 0, unit: 'ms' };
        case 'stress':
            return { value: Number(rawValue.score) || 0, unit: 'score' };
        case 'activity':
            return { value: Number(rawValue.minutes) || 0, unit: 'minutes' };
        default:
            return { value: 0, unit: 'unknown' };
    }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const wearableService = {
    /**
     * Ingest a batch of wearable data points. Normalizes and stores.
     * This is the plug-and-play entry point for wearable integrations.
     */
    async ingestData(userId: string, dataPoints: WearableDataPoint[]): Promise<{ inserted: number; errors: number }> {
        let inserted = 0;
        let errors = 0;

        for (const dp of dataPoints) {
            const { value, unit } = normalizeDataPoint(dp.dataType, dp.rawValue);
            try {
                const { error } = await supabase
                    .from('wearable_data')
                    .insert({
                        user_id: userId,
                        device_id: dp.deviceId,
                        device_type: dp.deviceType,
                        data_type: dp.dataType,
                        raw_value: dp.rawValue,
                        normalized_value: value,
                        unit,
                        recorded_at: dp.recordedAt,
                    });
                if (error) { errors++; } else { inserted++; }
            } catch { errors++; }
        }

        return { inserted, errors };
    },

    /**
     * Get recent data for a specific data type.
     */
    async getRecentData(userId: string, dataType: DataType, hours = 24): Promise<WearableDataPoint[]> {
        const since = new Date(Date.now() - hours * 3600000).toISOString();
        try {
            const { data, error } = await supabase
                .from('wearable_data')
                .select('*')
                .eq('user_id', userId)
                .eq('data_type', dataType)
                .gte('recorded_at', since)
                .order('recorded_at', { ascending: true });

            if (error || !data) return [];
            return data.map(r => ({
                id: r.id,
                deviceId: r.device_id,
                deviceType: r.device_type,
                dataType: r.data_type,
                rawValue: r.raw_value,
                normalizedValue: r.normalized_value,
                unit: r.unit,
                recordedAt: r.recorded_at,
            }));
        } catch { return []; }
    },

    /**
     * Get connected devices for a user.
     */
    async getDevices(userId: string): Promise<WearableDevice[]> {
        try {
            const { data } = await supabase
                .from('wearable_data')
                .select('device_id, device_type, synced_at')
                .eq('user_id', userId)
                .order('synced_at', { ascending: false });

            if (!data) return [];
            const seen = new Map<string, WearableDevice>();
            for (const d of data) {
                if (!seen.has(d.device_id)) {
                    seen.set(d.device_id, {
                        deviceId: d.device_id,
                        deviceType: d.device_type,
                        lastSyncAt: d.synced_at,
                    });
                }
            }
            return Array.from(seen.values());
        } catch { return []; }
    },
};
