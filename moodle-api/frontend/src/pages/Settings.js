import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Settings = () => {
  const { user, connectMoodle } = useAuth();
  const [moodleToken, setMoodleToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleConnectMoodle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await connectMoodle(moodleToken);
      setSuccess('Successfully connected to Moodle!');
      setMoodleToken('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to Moodle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="settings-section">
        <h2>Account Information</h2>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={user?.username || ''} disabled />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="text" value={user?.email || ''} disabled />
        </div>
      </div>

      <div className="settings-section">
        <h2>Moodle Connection</h2>
        
        <div className="moodle-status">
          <span 
            className={`status-indicator ${user?.moodleUserId ? 'connected' : 'disconnected'}`}
          ></span>
          <span>
            {user?.moodleUserId 
              ? `Connected (User ID: ${user.moodleUserId})` 
              : 'Not connected'}
          </span>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleConnectMoodle}>
          <div className="form-group">
            <label htmlFor="moodleToken">Moodle Web Service Token</label>
            <input
              type="password"
              id="moodleToken"
              value={moodleToken}
              onChange={(e) => setMoodleToken(e.target.value)}
              placeholder="Enter your Moodle token"
              required
            />
            <small className="form-hint">
              You can get your token from your Moodle site under Site administration → Plugins → Web services → Manage tokens
            </small>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Connecting...' : user?.moodleUserId ? 'Update Connection' : 'Connect to Moodle'}
          </button>
        </form>
      </div>

      <div className="settings-section">
        <h2>About</h2>
        <p>Moodle Interaction API - Built with MERN Stack</p>
        <p>This application allows you to interact with your Moodle LMS through a modern web interface.</p>
      </div>
    </div>
  );
};

export default Settings;
