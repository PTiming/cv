import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCourseDetail } from '../hooks/useMoodle';
import ActivityItem from '../components/ActivityItem';
import LoadingSpinner from '../components/LoadingSpinner';
import moodleService from '../services/moodleService';

const CourseDetail = () => {
  const { courseId } = useParams();
  const { contents, loading, error, fetchContents } = useCourseDetail(courseId);

  useEffect(() => {
    fetchContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleActivityComplete = async (activityId) => {
    try {
      await moodleService.markActivityComplete(activityId);
      // Refresh contents after marking complete
      fetchContents();
    } catch (err) {
      console.error('Failed to mark activity complete:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading course contents..." />;
  }

  if (error) {
    return (
      <div className="course-detail">
        <div className="error-message">{error}</div>
        <Link to="/courses" className="btn btn-secondary">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="course-detail">
      <Link to="/courses" className="btn btn-secondary back-link">
        ← Back to Courses
      </Link>

      <div className="course-header">
        <h1>Course Contents</h1>
        <div className="course-meta">
          <span>Course ID: {courseId}</span>
          <span>Sections: {contents.length}</span>
        </div>
      </div>

      {contents.length === 0 ? (
        <div className="settings-section">
          <p>No content available for this course.</p>
        </div>
      ) : (
        <div className="course-sections">
          {contents.map((section, index) => (
            <div key={section.id || index} className="section-card">
              <div className="section-header">
                <h3>{section.name || `Section ${index + 1}`}</h3>
              </div>
              {section.modules && section.modules.length > 0 ? (
                <ul className="activity-list">
                  {section.modules.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      onComplete={handleActivityComplete}
                    />
                  ))}
                </ul>
              ) : (
                <div className="section-empty">
                  No activities in this section
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
