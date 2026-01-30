import React from 'react';

const ActivityItem = ({ activity, onComplete }) => {
  const getActivityIcon = (modname) => {
    const icons = {
      assign: '📝',
      quiz: '❓',
      forum: '💬',
      resource: '📄',
      url: '🔗',
      page: '📃',
      book: '📚',
      folder: '📁',
      label: '🏷️',
      workshop: '🔧',
      glossary: '📖',
      wiki: '📑',
      choice: '🗳️',
      feedback: '📋',
      lesson: '📓',
      scorm: '🎓',
      data: '🗃️',
      chat: '💭',
      survey: '📊',
      lti: '🔌'
    };
    return icons[modname] || '📌';
  };

  const handleComplete = () => {
    if (onComplete && activity.completion !== 'none') {
      onComplete(activity.id);
    }
  };

  return (
    <li className="activity-item" onClick={handleComplete}>
      <div className="activity-icon">
        {getActivityIcon(activity.modname)}
      </div>
      <div className="activity-info">
        <h4>{activity.name}</h4>
        <p>{activity.modname}</p>
      </div>
      {activity.completion !== 'none' && (
        <div className="activity-completion">
          {activity.completionstate ? '✅' : '⬜'}
        </div>
      )}
    </li>
  );
};

export default ActivityItem;
