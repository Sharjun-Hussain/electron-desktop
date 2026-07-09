# Changelog

## [1.2.5] - 2026-07-09

### Added
- **Dark Mode Support**: The Kitchen Display System (KDS) page (`/kitchen`) now fully supports dark mode, with auto-adapting cards and statuses.
- **Restaurant Modules Sync**: Fully integrated all restaurant-specific POS features into the Electron desktop application, including:
  - Floor Plan / Tables (`/dining`)
  - Kitchen Display System (`/kitchen`)
  - Mobile Waiter UI (`/waiter`)
  - Customer Facing Display (`/customer-display`)
- **Dashboard Settings**: Added the new `dashboard-settings.jsx` interface for controlling dashboard behavior.

### Changed
- **Dashboard Enhancements**: The dashboard now conditionally shows or hides Kitchen Items and the Table Setup module based on the user's dashboard settings.
- **Session Management**: Refactored the recently synced restaurant modules to use the electron-native `@/components/auth/DesktopAuthProvider` instead of standard Next.js authentication (`next-auth/react`), preventing desktop session conflicts.
