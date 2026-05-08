import { DesktopAuthProvider } from '@/components/auth/DesktopAuthProvider';
import { ThemeProvider } from './providers/theme-provider';
import { SWRProvider } from './providers/swr-provider';
import SessionGuard from '@/components/auth/SessionGuard';
import { GlobalSettingsObserver } from '@/components/settings/GlobalSettingsObserver';

export default function Providers({ children }) {
  return <DesktopAuthProvider>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      <SWRProvider>
        <SessionGuard>
          <GlobalSettingsObserver />
          {children}
        </SessionGuard>
      </SWRProvider>
    </ThemeProvider>
  </DesktopAuthProvider>;
}