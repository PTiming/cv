import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMoodle } from '../hooks/useMoodle';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const { courses, loading, error, fetchCourses } = useMoodle();
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    completedCourses: 0
  });

  useEffect(() => {
    if (user?.moodleUserId) {
      fetchCourses();
    }
  }, [user, fetchCourses]);

  useEffect(() => {
    if (courses.length > 0) {
      setStats({
        totalCourses: courses.length,
        activeCourses: courses.filter(c => !c.completed).length,
        completedCourses: courses.filter(c => c.completed).length
      });
    }
  }, [courses]);

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.username}!</h1>

      {!user?.moodleUserId ? (
        <div className="settings-section">
          <h2>Connect to Moodle</h2>
          <p>You haven't connected your Moodle account yet. Connect it in the settings to access your courses.</p>
          <Link to="/settings" className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
            Go to Settings
          </Link>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Courses</h3>
              <div className="value">{stats.totalCourses}</div>
            </div>
            <div className="stat-card">
              <h3>Active Courses</h3>
              <div className="value">{stats.activeCourses}</div>
            </div>
            <div className="stat-card">
              <h3>Completed</h3>
              <div className="value">{stats.completedCourses}</div>
            </div>
          </div>

          <div className="settings-section">
            <h2>Recent Courses</h2>
            {loading ? (
              <LoadingSpinner message="Loading courses..." />
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : courses.length === 0 ? (
              <p>No courses found.</p>
            ) : (
              <div className="courses-grid">
                {courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="course-card">
                    <div className="course-card-header">
                      <h3>{course.fullname}</h3>
                    </div>
                    <div className="course-card-body">
                      <p>{course.shortname}</p>
                    </div>
                    <div className="course-card-footer">
                      <Link to={`/courses/${course.id}`} className="btn btn-primary">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {courses.length > 3 && (
              <Link to="/courses" className="btn btn-secondary" style={{ marginTop: '20px', display: 'inline-block' }}>
                View All Courses
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
