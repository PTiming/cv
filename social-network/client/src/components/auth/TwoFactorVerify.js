import React, { useState } from 'react';
import twoFactorService from '../../services/twoFactorService';
import './Auth.css';

const TwoFactorVerify = ({ tempToken, onSuccess, onCancel }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await twoFactorService.verify(tempToken, code);
      onSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tfa-verify-container">
      <div className="tfa-verify-card">
        <div className="tfa-verify-header">
          <h2>🔐 Two-Factor Authentication</h2>
          <p>
            {useBackupCode 
              ? 'Enter one of your backup codes' 
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="tfa-verify-form">
          <div className="code-input-container">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const val = useBackupCode 
                  ? e.target.value.toUpperCase().slice(0, 9) 
                  : e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(val);
              }}
              placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
              className="tfa-code-input"
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          <button 
            type="submit" 
            className="auth-btn" 
            disabled={loading || (useBackupCode ? code.length < 8 : code.length !== 6)}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div className="tfa-verify-options">
          <button 
            type="button" 
            className="toggle-backup-btn"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
              setError('');
            }}
          >
            {useBackupCode 
              ? '← Use authenticator app' 
              : 'Use a backup code instead'}
          </button>

          <button 
            type="button" 
            className="cancel-btn"
            onClick={onCancel}
          >
            Cancel login
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerify;
