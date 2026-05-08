"use client";

import { useSettingsStore } from "@/store/useSettingsStore";
import { translations } from "@/lib/i18n/translations";

/**
 * useTranslation Hook
 * Returns the translation dictionary based on the global language setting.
 * Provides a t() function for safe key access.
 */
export function useTranslation() {
  const language = useSettingsStore((state) => state.global.language || "en");

  const t = (keyPath) => {
    // keyPath could be "sidebar.dashboard"
    const keys = keyPath.split(".");
    let result = translations[language] || translations["en"];

    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        // Fallback to English if key missing in current language
        let fallback = translations["en"];
        for (const fKey of keys) {
            if (fallback && fallback[fKey]) {
                fallback = fallback[fKey];
            } else {
                fallback = keyPath; // Return path if totally missing
                break;
            }
        }
        return fallback;
      }
    }
    return result;
  };

  return { t, language, dict: translations[language] || translations["en"] };
}
