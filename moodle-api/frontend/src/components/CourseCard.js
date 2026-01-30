import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Safely strip HTML tags from text using DOM API
 */
const stripHtmlTags = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const CourseCard = ({ course }) => {
  const truncateSummary = (text, maxLength = 100) => {
    if (!text) return 'No description available';
    // Safely remove HTML tags using DOM API
    const plainText = stripHtmlTags(text);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  return (
    <div className="course-card">
      <div className="course-card-header">
        <h3>{course.fullname || course.displayname}</h3>
      </div>
      <div className="course-card-body">
        <p>{truncateSummary(course.summary)}</p>
      </div>
      <div className="course-card-footer">
        <span className="course-shortname">{course.shortname}</span>
        <Link to={`/courses/${course.id}`} className="btn btn-primary">
          View Course
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
