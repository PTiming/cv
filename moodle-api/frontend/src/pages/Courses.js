import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMoodle } from '../hooks/useMoodle';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const Courses = () => {
  const { user } = useAuth();
  const { courses, loading, error, fetchCourses } = useMoodle();

  useEffect(() => {
    if (user?.moodleUserId) {
      fetchCourses();
    }
  }, [user, fetchCourses]);

  if (!user?.moodleUserId) {
    return (
      <div className="courses-page">
        <h1>My Courses</h1>
        <div className="settings-section">
          <h2>Connect to Moodle</h2>
          <p>You need to connect your Moodle account to view your courses.</p>
          <Link to="/settings" className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <h1>My Courses</h1>

      {loading ? (
        <LoadingSpinner message="Loading courses..." />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : courses.length === 0 ? (
        <div className="settings-section">
          <p>No courses found. You may not be enrolled in any courses on Moodle.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;
