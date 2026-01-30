const crypto = require('crypto');

// Simple TOTP implementation without external dependencies
class TwoFactorService {
  constructor() {
    this.digits = 6;
    this.period = 30; // 30 seconds
    this.algorithm = 'sha1';
  }

  // Generate a random secret (Base32 encoded)
  generateSecret(length = 20) {
    const buffer = crypto.randomBytes(length);
    return this.base32Encode(buffer);
  }

  // Base32 encoding
  base32Encode(buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let result = '';

    for (let i = 0; i < buffer.length; i++) {
      bits += buffer[i].toString(2).padStart(8, '0');
    }

    for (let i = 0; i + 5 <= bits.length; i += 5) {
      const chunk = bits.substring(i, i + 5);
      result += alphabet[parseInt(chunk, 2)];
    }

    return result;
  }

  // Base32 decoding
  base32Decode(encoded) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';

    for (let char of encoded.toUpperCase().replace(/=/g, '')) {
      const val = alphabet.indexOf(char);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }

    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }

    return Buffer.from(bytes);
  }

  // Generate TOTP code
  generateTOTP(secret, timestamp = Date.now()) {
    const counter = Math.floor(timestamp / 1000 / this.period);
    return this.generateHOTP(secret, counter);
  }

  // Generate HOTP code
  generateHOTP(secret, counter) {
    const decodedSecret = this.base32Decode(secret);
    
    // Convert counter to 8-byte buffer
    const counterBuffer = Buffer.alloc(8);
    for (let i = 7; i >= 0; i--) {
      counterBuffer[i] = counter & 0xff;
      counter = Math.floor(counter / 256);
    }

    // Generate HMAC
    const hmac = crypto.createHmac(this.algorithm, decodedSecret);
    hmac.update(counterBuffer);
    const hmacResult = hmac.digest();

    // Dynamic truncation
    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const code = (
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff)
    ) % Math.pow(10, this.digits);

    return code.toString().padStart(this.digits, '0');
  }

  // Verify TOTP code (with time window tolerance)
  verifyTOTP(secret, token, window = 1) {
    const now = Date.now();
    
    for (let i = -window; i <= window; i++) {
      const timestamp = now + (i * this.period * 1000);
      const expectedToken = this.generateTOTP(secret, timestamp);
      
      if (this.safeCompare(token, expectedToken)) {
        return true;
      }
    }
    
    return false;
  }

  // Timing-safe string comparison
  safeCompare(a, b) {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  // Generate backup codes
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      // Format: XXXX-XXXX
      codes.push({
        code: `${code.slice(0, 4)}-${code.slice(4)}`,
        used: false
      });
    }
    return codes;
  }

  // Verify backup code
  verifyBackupCode(storedCodes, inputCode) {
    const normalizedInput = inputCode.replace(/-/g, '').toUpperCase();
    
    for (let i = 0; i < storedCodes.length; i++) {
      const storedCode = storedCodes[i].code.replace(/-/g, '').toUpperCase();
      
      if (!storedCodes[i].used && this.safeCompare(normalizedInput, storedCode)) {
        return { valid: true, index: i };
      }
    }
    
    return { valid: false, index: -1 };
  }

  // Generate QR code URL (otpauth:// URL format)
  generateQRCodeURL(secret, email, issuer = 'EduConnect') {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${this.digits}&period=${this.period}`;
  }

  // Generate QR code as data URL (using a simple API)
  getQRCodeImageURL(otpauthURL) {
    // Using Google Charts API to generate QR code
    const encodedURL = encodeURIComponent(otpauthURL);
    return `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodedURL}`;
  }
}

module.exports = new TwoFactorService();
