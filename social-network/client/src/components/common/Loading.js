import React from 'react';
import './Loading.css';

const Loading = ({ size = 'medium', text = '' }) => {
  return (
    <div className={`loading-container ${size}`}>
      <div className="loading-spinner"></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default Loading;
