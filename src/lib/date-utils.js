import { format as originalFormat } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Timezone-aware date-fns format wrapper.
 * Automatically applies the organization's timezone from global settings.
 */
export function format(date, formatStr, options = {}) {
  if (!date) return "";
  
  try {
    let dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
    // Safety check for invalid dates
    if (isNaN(dateObj.getTime())) {
      return "";
    }

    const state = useSettingsStore.getState();
    const tz = state.general?.localization?.timeZone;

    if (tz) {
      return formatInTimeZone(dateObj, tz, formatStr, options);
    }
    
    // Fallback to local browser timezone if settings are not loaded
    return originalFormat(dateObj, formatStr, options);
  } catch (error) {
    console.warn("Date formatting error:", error);
    return ""; // Fail gracefully instead of crashing the UI
  }
}
