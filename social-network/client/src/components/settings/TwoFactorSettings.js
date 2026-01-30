import React, { useState, useEffect } from 'react';
import twoFactorService from '../../services/twoFactorService';
import './TwoFactorSettings.css';

const TwoFactorSettings = () => {
  const [status, setStatus] = useState({ enabled: false, backupCodesRemaining: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Setup state
  const [setupData, setSetupData] = useState(null);
  const [setupCode, setSetupCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  // Disable state
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  
  // Regenerate backup codes state
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await twoFactorService.getStatus();
      setStatus(response.data);
    } catch (err) {
      setError('Failed to fetch 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      setError('');
      setSuccess('');
      const response = await twoFactorService.setup();
      setSetupData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to setup 2FA');
    }
  };

  const handleEnable = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await twoFactorService.enable(setupCode);
      setBackupCodes(response.data.backupCodes);
      setShowBackupCodes(true);
      setSetupData(null);
      setSetupCode('');
      setStatus({ ...status, enabled: true, backupCodesRemaining: response.data.backupCodes.length });
      setSuccess('2FA enabled successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enable 2FA');
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await twoFactorService.disable(disablePassword, disableCode);
      setStatus({ enabled: false, backupCodesRemaining: 0 });
      setShowDisableForm(false);
      setDisablePassword('');
      setDisableCode('');
      setSuccess('2FA disabled successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  const handleRegenerateBackupCodes = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await twoFactorService.regenerateBackupCodes(regeneratePassword, regenerateCode);
      setBackupCodes(response.data.backupCodes);
      setShowBackupCodes(true);
      setShowRegenerateForm(false);
      setRegeneratePassword('');
      setRegenerateCode('');
      setStatus({ ...status, backupCodesRemaining: response.data.backupCodes.length });
      setSuccess('Backup codes regenerated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate backup codes');
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setSuccess('Backup codes copied to clipboard!');
  };

  if (loading) {
    return <div className="tfa-loading">Loading...</div>;
  }

  return (
    <div className="two-factor-settings">
      <h2>🔐 Two-Factor Authentication (2FA)</h2>
      
      {error && <div className="tfa-error">{error}</div>}
      {success && <div className="tfa-success">{success}</div>}

      <div className="tfa-status">
        <div className={`status-badge ${status.enabled ? 'enabled' : 'disabled'}`}>
          {status.enabled ? '✅ Enabled' : '❌ Disabled'}
        </div>
        {status.enabled && (
          <p className="backup-info">
            Backup codes remaining: <strong>{status.backupCodesRemaining}</strong>
          </p>
        )}
      </div>

      {!status.enabled && !setupData && (
        <div className="tfa-section">
          <h3>Enable 2FA</h3>
          <p>Add an extra layer of security to your account by requiring a verification code in addition to your password.</p>
          <button onClick={handleSetup} className="btn-primary">
            🛡️ Setup Two-Factor Authentication
          </button>
        </div>
      )}

      {setupData && (
        <div className="tfa-setup">
          <h3>Step 1: Scan QR Code</h3>
          <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
          
          <div className="qr-code-container">
            <img src={setupData.qrCodeURL} alt="2FA QR Code" />
          </div>
          
          <div className="manual-entry">
            <p>Or enter this code manually:</p>
            <code className="secret-code">{setupData.secret}</code>
          </div>

          <h3>Step 2: Verify Setup</h3>
          <p>Enter the 6-digit code from your authenticator app:</p>
          
          <form onSubmit={handleEnable} className="verify-form">
            <input
              type="text"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              className="code-input"
            />
            <button type="submit" className="btn-primary" disabled={setupCode.length !== 6}>
              Verify & Enable
            </button>
            <button type="button" onClick={() => setSetupData(null)} className="btn-secondary">
              Cancel
            </button>
          </form>
        </div>
      )}

      {showBackupCodes && (
        <div className="backup-codes-modal">
          <div className="backup-codes-content">
            <h3>⚠️ Save Your Backup Codes</h3>
            <p>These codes can be used to access your account if you lose your authenticator device. Each code can only be used once.</p>
            
            <div className="codes-grid">
              {backupCodes.map((code, index) => (
                <code key={index} className="backup-code">{code}</code>
              ))}
            </div>
            
            <div className="backup-actions">
              <button onClick={copyBackupCodes} className="btn-secondary">
                📋 Copy All Codes
              </button>
              <button onClick={() => setShowBackupCodes(false)} className="btn-primary">
                I've Saved My Codes
              </button>
            </div>
          </div>
        </div>
      )}

      {status.enabled && (
        <div className="tfa-enabled-options">
          <div className="tfa-section">
            <h3>Regenerate Backup Codes</h3>
            <p>If you've used most of your backup codes, you can generate new ones.</p>
            {!showRegenerateForm ? (
              <button onClick={() => setShowRegenerateForm(true)} className="btn-secondary">
                🔄 Regenerate Backup Codes
              </button>
            ) : (
              <form onSubmit={handleRegenerateBackupCodes} className="tfa-form">
                <input
                  type="password"
                  value={regeneratePassword}
                  onChange={(e) => setRegeneratePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                />
                <input
                  type="text"
                  value={regenerateCode}
                  onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 2FA code"
                  maxLength="6"
                  className="code-input"
                />
                <div className="form-buttons">
                  <button type="submit" className="btn-primary">Regenerate</button>
                  <button type="button" onClick={() => setShowRegenerateForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="tfa-section danger">
            <h3>Disable 2FA</h3>
            <p>This will remove the extra security from your account.</p>
            {!showDisableForm ? (
              <button onClick={() => setShowDisableForm(true)} className="btn-danger">
                🚫 Disable Two-Factor Authentication
              </button>
            ) : (
              <form onSubmit={handleDisable} className="tfa-form">
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                />
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 2FA code"
                  maxLength="6"
                  className="code-input"
                />
                <div className="form-buttons">
                  <button type="submit" className="btn-danger">Disable 2FA</button>
                  <button type="button" onClick={() => setShowDisableForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSettings;
