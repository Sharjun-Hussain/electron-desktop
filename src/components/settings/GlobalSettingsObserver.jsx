"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/app/hooks/swr/useSettings";

export function GlobalSettingsObserver() {
    const { useModularSettings } = useSettings();
    const { data: response } = useModularSettings('general');
    const { theme: currentTheme, setTheme } = useTheme();
    
    // We use a ref to prevent the observer from overriding the theme 
    // if the user has manually changed it in this specific session/page-view
    // until the data from the server actually changes.
    const lastServerTheme = useRef(null);
    const lastServerFontSize = useRef(null);

    useEffect(() => {
        if (response?.data?.interface) {
            const { theme, fontSize } = response.data.interface;
            
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
    }, [response, setTheme]);

    return null;
}
