import qz from "qz-tray";
import { getDesktopSession } from "@/lib/desktop-auth";

/**
 * QZ Tray Service
 * Handles WebSocket connection to local hardware.
 */

let isConnected = false;

/**
 * SECURITY CONFIGURATION
 * This identifies the POS to QZ Tray to unlock silent printing.
 */
qz.security.setCertificatePromise((resolve, reject) => {
    // This is the public certificate that identifies your app.
    resolve(
      "-----BEGIN CERTIFICATE-----\n" +
      "MIID6TCCAtGgAwIBAgIUDvBZ+hh8DnXMrXhuMsitWxbs1dMwDQYJKoZIhvcNAQEL\n" +
      "BQAwgYMxCzAJBgNVBAYTAkxLMRAwDgYDVQQIDAdFYXN0ZXJuMRAwDgYDVQQHDAdD\n" +
      "b2xvbWJvMRowGAYDVQQKDBFJbnplZWRvIChQVlQpIEx0ZDEQMA4GA1UEAwwHSW56\n" +
      "ZWVkbzEiMCAGCSqGSIb3DQEJARYTbXJqb29uMDA1QGdtYWlsLmNvbTAeFw0yNjA3\n" +
      "MDIwODM5MzNaFw0zNjA2MjkwODM5MzNaMIGDMQswCQYDVQQGEwJMSzEQMA4GA1UE\n" +
      "CAwHRWFzdGVybjEQMA4GA1UEBwwHQ29sb21ibzEaMBgGA1UECgwRSW56ZWVkbyAo\n" +
      "UFZUKSBMdGQxEDAOBgNVBAMMB0luemVlZG8xIjAgBgkqhkiG9w0BCQEWE21yam9v\n" +
      "bjAwNUBnbWFpbC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDK\n" +
      "JIdiDr3GQcDbqRpvaVipqCc6GwOI+yLAcHCT4K4L8ARC1wabzNioRrXedYeQ+Ng4\n" +
      "ptYmZ8T6bQc1fXcx56qZVt0KOKOAS/KXiwrEA1fhyNlaweAdghL8R1MEm3FY6bOP\n" +
      "irVwndckqYL0jV3rcjakfhqcvtAgXCQaJKSn72h4j9prfbaWM+SK+xWiAwFFxnkh\n" +
      "fqyyg+CX70Au8wmvcsfB9JD8ekiWu1icGiXMG/ZDnUFSYu8Tq5JQbtB+ZUUcGZjD\n" +
      "7jFpeW8rmZDWuN6o05c9nhm9ZjNrrhsMhtRrmBn+uwEOyDqTj32vkJdBowsQJT8T\n" +
      "zJf96v32N4vVviYko5qvAgMBAAGjUzBRMB0GA1UdDgQWBBQcNlDN9N3jNhxuJ50T\n" +
      "xcLXJdRofjAfBgNVHSMEGDAWgBQcNlDN9N3jNhxuJ50TxcLXJdRofjAPBgNVHRMB\n" +
      "Af8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQBi4ziDXvl66oBlVinK7klQgWIF\n" +
      "CIuxgyY9PUwF3S+c+t9x3Yd9EGvV6/kaNxKqg+6YrZjmiJ283Ug6yZ4OIj33rO45\n" +
      "j6recmewhka/YV5IL0j+u/3ho4TNwzNrVyDbSQi2NrQrZeyYwFRUnME3bSie4kjV\n" +
      "Dquk3R2I7jA73Zo5haCheT5k+ygUwrlMgYqjCeJFWfOXgSDLv4mokm+EfDvcPVPG\n" +
      "wRiabejtkgCJvfYza/I2J5Gi/WerFwoQ9nfj4+PScH2VLdHPiyl5KM6VgMaJ4XlH\n" +
      "obLvR6ZI3bKSyJrPaRg6NGRFBiKZxqS1abj8SJUvjT3zH+EywYUY/zUqcGfd\n" +
      "-----END CERTIFICATE-----"
    );
});

qz.security.setSignatureAlgorithm("SHA512");

qz.security.setSignaturePromise((toSign) => {
    return (resolve, reject) => {
        Promise.resolve(getDesktopSession()).then(session => {
            if (!session?.accessToken) {
                reject("User not authenticated");
                return;
            }

            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/hardware/sign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({ toSign })
            })
            .then(res => {
                if (!res.ok) throw new Error("Signature request failed");
                return res.text();
            })
            .then(signature => resolve(signature))
            .catch(err => {
                console.error("[QZ Signing] Failed:", err);
                reject(err);
            });
        });
    };
});

export const hardwareService = {
  /**
   * Connect to QZ Tray local service
   */
  connect: async () => {
    if (isConnected && qz.websocket.isActive()) return true;

    try {
      await qz.websocket.connect();
      isConnected = true;
      console.log("[Hardware] Connected to QZ Tray");
      return true;
    } catch (err) {
      console.error("[Hardware] QZ Tray not found. Please ensure QZ Tray is running.", err);
      return false;
    }
  },

  /**
   * Find and select a printer
   */
  findPrinter: async (printerName = null) => {
    try {
      const printer = await qz.printers.find(printerName);
      return printer;
    } catch (err) {
      console.error("[Hardware] Printer not found via QZ, attempting native fallback:", err);
      // Fallback to native Electron API if available
      if (typeof window !== "undefined" && window.api && window.api.getPrinters) {
        try {
          const nativePrinters = await window.api.getPrinters();
          if (printerName) {
            const found = nativePrinters.find(p => p.name.includes(printerName) || p.displayName === printerName);
            if (found) return found.name;
          } else if (nativePrinters.length > 0) {
            return nativePrinters.map(p => p.name);
          }
        } catch (nativeErr) {
          console.error("[Hardware] Native fallback also failed:", nativeErr);
        }
      }
      return null;
    }
  },

  /**
   * Print a receipt using HTML/CSS
   * This takes the HTML from our ReceiptTemplate and sends it to the printer.
   */
  printHTML: async (printerName, htmlContent) => {
    try {
      const config = qz.configs.create(printerName);
      const data = [{
        type: 'html',
        format: 'plain',
        data: htmlContent
      }];
      await qz.print(config, data);
      return true;
    } catch (err) {
      console.error("[Hardware] Print failed:", err);
      throw err;
    }
  },

  /**
   * Print a receipt using RAW bytes (ESC/POS)
   * This takes a Uint8Array and sends it natively to the printer.
   */
  printRaw: async (printerName, buffer) => {
    try {
      const config = qz.configs.create(printerName);
      
      let b64 = buffer;
      if (typeof buffer !== "string") {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        b64 = window.btoa(binary);
      }

      const data = [{
        type: 'raw',
        format: 'base64',
        data: b64
      }];
      
      await qz.print(config, data);
      return true;
    } catch (err) {
      console.error("[Hardware] Raw print failed:", err);
      throw err;
    }
  },

  /**
   * Open Cash Drawer
   * Sends the standard EPSON/Star 'Kick' command
   */
  openCashDrawer: async (printerName) => {
    try {
      const config = qz.configs.create(printerName);
      // Standard ESC/POS command to kick the drawer (Pin 2 and Pin 5)
      const data = ['\x1B\x70\x00\x19\xFA'];
      await qz.print(config, data);
      return true;
    } catch (err) {
      console.error("[Hardware] Failed to open cash drawer:", err);
      return false;
    }
  },
  /**
   * Find available Serial/COM ports
   */
  findSerialPorts: async () => {
    try {
      return await qz.serial.findPorts();
    } catch (err) {
      console.error("[Hardware] Serial discovery failed:", err);
      return [];
    }
  },

  /**
   * Read from Digital Scale
   * Note: Most scales use 9600 baud, 8 data bits, 1 stop bit, no parity.
   */
  readScale: async (port, onData) => {
    try {
      await qz.serial.openPort(port, {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'NONE'
      });

      // Set up listener for scale data
      qz.serial.setSerialCallbacks((event) => {
        if (event.portName === port && event.type === 'RECEIVE') {
          // Parse weight from typical scale output (e.g., "  0.455 kg")
          const raw = event.data;
          const weightMatch = raw.match(/[-+]?[0-9]*\.?[0-9]+/);
          if (weightMatch) {
            onData(parseFloat(weightMatch[0]));
          }
        }
      });

      // Some scales need a "W" command to send weight
      // await qz.serial.sendData(port, 'W\r\n');

      return true;
    } catch (err) {
      console.error("[Hardware] Scale connection failed:", err);
      return false;
    }
  },

  /**
   * Close Scale/Serial Connection
   */
  closeSerial: async (port) => {
    try {
      await qz.serial.closePort(port);
      return true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Send text to Customer Display (VFD)
   * Most displays are 20x2 characters.
   */
  updateDisplay: async (port, line1, line2 = "") => {
    try {
      await qz.serial.openPort(port);

      // Clear display & move cursor to home (standard ESC/POS)
      const clearCmd = '\x1B\x40\x0C';
      const text = `${line1.padEnd(20)}\n${line2.padEnd(20)}`;

      await qz.serial.sendData(port, clearCmd + text);
      return true;
    } catch (err) {
      console.error("[Hardware] Display update failed:", err);
      return false;
    }
  }
};
