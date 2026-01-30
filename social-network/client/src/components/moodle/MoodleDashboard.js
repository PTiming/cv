import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBook, FaClipboardList, FaClock, FaUsers, FaLink, FaUnlink } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';
import moodleService from '../../services/moodleService';
import authService from '../../services/authService';
import './MoodleDashboard.css';

const MoodleDashboard = () => {
  const { user, updateUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkingMoodle, setLinkingMoodle] = useState(false);
  const [moodleCredentials, setMoodleCredentials] = useState({
    moodleUsername: '',
    moodlePassword: ''
  });

  useEffect(() => {
    if (user?.moodleLinked) {
      fetchMoodleData();
    } else {
      setLoading(false);
    }
  }, [user?.moodleLinked]);

  const fetchMoodleData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [coursesRes, deadlinesRes] = await Promise.all([
        moodleService.getCourses(),
        moodleService.getDeadlines()
      ]);

      if (coursesRes.success) {
        setCourses(coursesRes.data);
      }
      if (deadlinesRes.success) {
        setDeadlines(deadlinesRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch Moodle data');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkMoodle = async (e) => {
    e.preventDefault();
    setLinkingMoodle(true);
    setError('');

    try {
      const response = await authService.linkMoodle(moodleCredentials);
      if (response.success) {
        updateUser({ moodleLinked: true });
        setMoodleCredentials({ moodleUsername: '', moodlePassword: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link Moodle account');
    } finally {
      setLinkingMoodle(false);
    }
  };

  const handleUnlinkMoodle = async () => {
    if (!window.confirm('Are you sure you want to unlink your Moodle account?')) {
      return;
    }

    try {
      await authService.unlinkMoodle();
      updateUser({ moodleLinked: false });
      setCourses([]);
      setDeadlines([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unlink Moodle account');
    }
  };

  const handleSyncNotifications = async () => {
    try {
      const response = await moodleService.syncNotifications();
      if (response.success) {
        alert(`Synced ${response.data.newNotifications} new notifications`);
      }
    } catch (err) {
      setError('Failed to sync notifications');
    }
  };

  // Moodle Link Form
  if (!user?.moodleLinked) {
    return (
      <div className="moodle-container">
        <div className="moodle-link-card">
          <div className="link-header">
            <FaBook className="moodle-icon" />
            <h1>Connect to Moodle LMS</h1>
            <p>Link your Moodle account to access courses, assignments, and deadlines</p>
          </div>

          {error && <div className="moodle-error">{error}</div>}

          <form onSubmit={handleLinkMoodle} className="link-form">
            <div className="form-group">
              <label>Moodle Username</label>
              <input
                type="text"
                value={moodleCredentials.moodleUsername}
                onChange={e => setMoodleCredentials({
                  ...moodleCredentials,
                  moodleUsername: e.target.value
                })}
                placeholder="Enter your Moodle username"
                required
              />
            </div>

            <div className="form-group">
              <label>Moodle Password</label>
              <input
                type="password"
                value={moodleCredentials.moodlePassword}
                onChange={e => setMoodleCredentials({
                  ...moodleCredentials,
                  moodlePassword: e.target.value
                })}
                placeholder="Enter your Moodle password"
                required
              />
            </div>

            <button type="submit" className="link-btn" disabled={linkingMoodle}>
              <FaLink /> {linkingMoodle ? 'Connecting...' : 'Connect Moodle Account'}
            </button>
          </form>

          <p className="security-note">
            🔒 Your credentials are used only to authenticate with Moodle and are not stored.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading text="Loading Moodle data..." />;
  }

  return (
    <div className="moodle-container">
      <div className="moodle-header">
        <h1><FaBook /> Moodle Dashboard</h1>
        <div className="header-actions">
          <button className="sync-btn" onClick={handleSyncNotifications}>
            Sync Notifications
          </button>
          <button className="unlink-btn" onClick={handleUnlinkMoodle}>
            <FaUnlink /> Unlink Account
          </button>
        </div>
      </div>

      {error && <div className="moodle-error">{error}</div>}

      <div className="moodle-grid">
        {/* Upcoming Deadlines */}
        <div className="moodle-card deadlines-card">
          <h2><FaClock /> Upcoming Deadlines</h2>
          {deadlines.length === 0 ? (
            <p className="no-data">No upcoming deadlines</p>
          ) : (
            <ul className="deadlines-list">
              {deadlines.slice(0, 5).map((deadline, index) => (
                <li key={index} className="deadline-item">
                  <div className="deadline-info">
                    <span className="deadline-name">{deadline.name}</span>
                    <span className="deadline-course">{deadline.courseName}</span>
                  </div>
                  <span className="deadline-date">
                    {new Date(deadline.dueDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Enrolled Courses */}
        <div className="moodle-card courses-card">
          <h2><FaClipboardList /> My Courses</h2>
          {courses.length === 0 ? (
            <p className="no-data">No courses found</p>
          ) : (
            <div className="courses-grid">
              {courses.map(course => (
                <Link 
                  key={course.id} 
                  to={`/moodle/course/${course.id}`}
                  className="course-item"
                >
                  <div className="course-icon">
                    <FaBook />
                  </div>
                  <div className="course-info">
                    <h3>{course.shortname || course.fullname}</h3>
                    <p>{course.fullname}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodleDashboard;
