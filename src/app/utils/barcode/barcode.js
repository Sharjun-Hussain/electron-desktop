// Barcode generation and validation utilities

/**
 * Generates a random EAN-13 barcode
 * EAN-13 is the most common barcode format for retail products
 */
export function generateEAN13() {
  // Generate 12 random digits
  let code = ""
  for (let i = 0; i < 12; i++) {
    code += Math.floor(Math.random() * 10)
  }

  // Calculate check digit
  const checkDigit = calculateEAN13CheckDigit(code)
  return code + checkDigit
}

/**
 * Calculates the check digit for an EAN-13 barcode
 */
function calculateEAN13CheckDigit(code) {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = Number.parseInt(code[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit
}

/**
 * Validates an EAN-13 barcode
 */
export function validateEAN13(barcode) {
  if (!/^\d{13}$/.test(barcode)) {
    return false
  }

  const code = barcode.slice(0, 12)
  const checkDigit = Number.parseInt(barcode[12])
  return calculateEAN13CheckDigit(code) === checkDigit
}

/**
 * Generates a simple numeric barcode (for internal use)
 */
export function generateSimpleBarcode(prefix = "PRD") {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `${prefix}${timestamp}${random}`
}

/**
 * Formats a barcode for display (adds spaces for readability)
 */
export function formatBarcodeDisplay(barcode) {
  if (barcode.length === 13) {
    // EAN-13 format: X-XXXXXX-XXXXXX-X
    return `${barcode[0]}-${barcode.slice(1, 7)}-${barcode.slice(7, 13)}`
  }
  return barcode
}
