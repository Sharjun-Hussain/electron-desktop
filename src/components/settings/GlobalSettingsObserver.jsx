"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { useSettingsStore } from "@/store/useSettingsStore";

export function GlobalSettingsObserver() {
    const { useModularSettings } = useSettings();
    const { data: response } = useModularSettings('general');
    const { theme: currentTheme, setTheme } = useTheme();
    const setGeneralSettings = useSettingsStore(state => state.setGeneralSettings);
    
    // We use a ref to prevent the observer from overriding the theme 
    // if the user has manually changed it in this specific session/page-view
    // until the data from the server actually changes.
    const lastServerTheme = useRef(null);
    const lastServerFontSize = useRef(null);
    const lastGeneralData = useRef(null);

    useEffect(() => {
        if (response?.data) {
            const generalData = response.data;
            
            // Sync general settings (like localization, currency) to Zustand store
            if (JSON.stringify(generalData) !== lastGeneralData.current) {
                setGeneralSettings(generalData);
                lastGeneralData.current = JSON.stringify(generalData);
            }

            if (generalData.interface) {
                const { theme, fontSize } = generalData.interface;
                
                // Sync Theme: Only if the server theme has actually changed 
                // since we last applied it, to avoid "fighting" with local UI state.
                if (theme && theme !== lastServerTheme.current) {
                    setTheme(theme);
                    lastServerTheme.current = theme;
                }

                // Sync Font Size
                if (fontSize && fontSize !== lastServerFontSize.current) {
                    document.documentElement.style.fontSize = `${fontSize}px`;
                    lastServerFontSize.current = fontSize;
                }
            }
        }
    }, [response, setTheme, setGeneralSettings]);

    return null;
}
