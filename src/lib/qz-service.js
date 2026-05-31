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
    resolve("-----BEGIN CERTIFICATE-----\n" +
            "MIID6TCCAtGgAwIBAgIUc5X1GAheUsR6znOBj5EJE0KfJl0wDQYJKoZIhvcNAQEL\n" +
            "BQAwgYIxCzAJBgNVBAYTAkxLMRAwDgYDVQQIDAdFYXN0ZXJuMRAwDgYDVQQHDAdD\n" +
            "b2xvbWJvMRowGAYDVQQKDBFJbnplZWRvIChQVlQpIEx0ZDEQMA4GA1UEAwwHSW56\n" +
            "ZWVkbzEiMCAGCSqGSIb3DQEJARYTbXJqb29uMDA1QGdtYWlsLmNvbTAeFw0yNjA1\n" +
            "MTUwOTEyNDhaFw0zNjA1MTIwOTEyNDhaMIGDMQswCQYDVQQGEwJMSzEQMA4GA1UE\n" +
            "CAwHRWFzdGVybjEQMA4GA1UEBwwHQ29sb21ibzEaMBgGA1UECgwRSW56ZWVkbyAo\n" +
            "UFZUKSBMdGQxEDAOBgNVBAMMB0luemVlZG8xIjAgBgkqhkiG9w0BCQEWE21yam9v\n" +
            "bjAwNUBnbWFpbC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDF\n" +
            "Ea1kT2vQZwQUqgcpjJgPy8JtZ7ZKErGME/kZRtRK+y6rmGHjsEX2LumbJVGHrFhn\n" +
            "nsAL1ZoWEeH5l1BociisYTXjSI9o1ekEKoat/iG5AiF8mx8nSXZrQTqrBrCubBZg\n" +
            "AC8JDpBFl8aw+BaGxQK+zChlDjutm7KOy5l6QivlY1zuCcq7zHPfLhTrh73y3FM8\n" +
            "dT/gIkyxdDcJ5PQo4rQ51hJp+P9dPYWwQBz8Gh7fKeygXlcGTP1YCl/rfr068j00\n" +
            "UDwGwWNXtqu4SfmkPl+tIu2De0PALQotHi1/bBwwPaUhyK7GWhyQsbh258gA31MD\n" +
            "yHlLsZKY0hJv82CqXYRdAgMBAAGjUzBRMB0GA1UdDgQWBBQP2zTpXGNmNvmGg39+\n" +
            "mdxt3dHonTAfBgNVHSMEGDAWgBQP2zTpXGNmNvmGg39+mdxt3dHonTAPBgNVHRMB\n" +
            "Af8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQBVnbdQZ/YllW2BzU1NzWQEpt1I\n" +
            "uwNP7qrLJYk+Fjq6tzlx4myzIL2F2rjEJZq+aM9AcnD56LSuTbrH8F7+W1kLBvuL\n" +
            "2S3kLTmhqms5p66hKPt+0NYOV5gE3i3mK7nn5IlBG0i/W9X0CZGPBqRAghR7y5H8\n" +
            "ji1Gh962KKaMYVhzxicLn0DyKICLPixy/kgkYag8owS9eFpLpdRhMAKFcJXGLGiE\n" +
            "Iq8PVPDIceLdCA6IooIWPzwsw0DO+QtmjckuoVSnbydx4LOPdAslT4nJwlw4p5Ln\n" +
            "vjsa1wDcUW6yzHEr+VWNsf2kT/eb+IE7N55Yia0/q6VuupbIrIVIDWGY85OS\n" +
            "-----END CERTIFICATE-----");
});

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
      console.error("[Hardware] Printer not found:", err);
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
