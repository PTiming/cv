import api from './api';

const twoFactorService = {
  // Get 2FA status
  getStatus: async () => {
    const response = await api.get('/auth/2fa/status');
    return response.data;
  },

  // Setup 2FA - Get secret and QR code
  setup: async () => {
    const response = await api.post('/auth/2fa/setup');
    return response.data;
  },

  // Enable 2FA
  enable: async (code) => {
    const response = await api.post('/auth/2fa/enable', { code });
    return response.data;
  },

  // Disable 2FA
  disable: async (password, code) => {
    const response = await api.post('/auth/2fa/disable', { password, code });
    return response.data;
  },

  // Verify 2FA during login
  verify: async (tempToken, code) => {
    const response = await api.post('/auth/2fa/verify', { tempToken, code });
    return response.data;
  },

  // Regenerate backup codes
  regenerateBackupCodes: async (password, code) => {
    const response = await api.post('/auth/2fa/backup-codes', { password, code });
    return response.data;
  }
};

export default twoFactorService;
