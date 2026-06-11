<div align="center">
  <h1>Inzeedo ERP - Electron Desktop Client</h1>
  <p>Optimized Desktop Point-of-Sale client with native hardware integrations.</p>
</div>

---

## 📖 Overview

The **Electron Desktop Client** provides a highly integrated, native desktop experience for the Inzeedo ERP ecosystem. Built by wrapping the Next.js application within an Electron shell, this client is specifically tailored for dedicated POS terminals, offering deep integration with local hardware such as receipt printers, cash drawers, and barcode scanners.

## ⚡ Key Features

- **Native Hardware Support**: Direct integration with QZ Tray and native OS APIs for thermal receipt printing and peripheral management.
- **Enhanced Performance**: Leverages local desktop resources for smoother transaction processing.
- **Offline Resilience Capabilities**: Designed to handle intermittent connectivity better than a standard browser environment.
- **Kiosk/Full-Screen Mode**: Can be locked down for dedicated cashier terminal usage.
- **Unified Codebase**: Shares the core UI and logic with the Web client via Next.js, ensuring feature parity.

## 🛠 Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/) & [Next.js](https://nextjs.org/)
- **UI Library**: [React](https://reactjs.org/)
- **Hardware Integration**: QZ Tray API
- **Styling**: Tailwind CSS & shadcn/ui

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- npm or yarn

### Installation

1. Clone the repository and navigate to the `electron-desktop` directory:
   ```bash
   cd pos/important/electron-desktop
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To start the Electron application in development mode with hot-reloading:
```bash
npm run dev
```
*(This command typically starts the Next.js dev server concurrently with the Electron main process).*

## 📦 Build & Packaging

To package the application for distribution (e.g., creating `.exe`, `.dmg`, or `.AppImage` files):
```bash
npm run build
npm run package
```
*Note: Refer to the `electron-builder` configuration in `package.json` for specific platform targets.*
