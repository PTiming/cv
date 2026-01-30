import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaBook, FaFile, FaClipboard, FaQuestion, FaUsers, FaGraduationCap } from 'react-icons/fa';
import Loading from '../common/Loading';
import PostCard from '../feed/PostCard';
import CreatePost from '../feed/CreatePost';
import moodleService from '../../services/moodleService';
import postService from '../../services/postService';
import './CourseDetail.css';

const CourseDetail = () => {
  const { courseId } = useParams();
  const [contents, setContents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [contentsRes, postsRes, usersRes] = await Promise.all([
        moodleService.getCourseContents(courseId),
        postService.getCoursePosts(courseId),
        moodleService.getCourseUsers(courseId).catch(() => ({ success: true, data: [] }))
      ]);

      if (contentsRes.success) {
        setContents(contentsRes.data);
      }
      if (postsRes.success) {
        setPosts(postsRes.data);
      }
      if (usersRes.success) {
        setUsers(usersRes.data);
      }
    } catch (err) {
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const getModuleIcon = (modname) => {
    switch (modname) {
      case 'assign':
        return <FaClipboard />;
      case 'quiz':
        return <FaQuestion />;
      case 'resource':
      case 'folder':
        return <FaFile />;
      default:
        return <FaBook />;
    }
  };

  if (loading) {
    return <Loading text="Loading course..." />;
  }

  return (
    <div className="course-detail-container">
      <Link to="/moodle" className="back-link">
        <FaArrowLeft /> Back to Dashboard
      </Link>

      {error && <div className="course-error">{error}</div>}

      {/* Tabs */}
      <div className="course-tabs">
        <button 
          className={activeTab === 'content' ? 'active' : ''}
          onClick={() => setActiveTab('content')}
        >
          <FaBook /> Content
        </button>
        <button 
          className={activeTab === 'discussion' ? 'active' : ''}
          onClick={() => setActiveTab('discussion')}
        >
          <FaGraduationCap /> Discussion
        </button>
        <button 
          className={activeTab === 'participants' ? 'active' : ''}
          onClick={() => setActiveTab('participants')}
        >
          <FaUsers /> Participants
        </button>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="course-content">
          {contents.length === 0 ? (
            <p className="no-content">No content available</p>
          ) : (
            contents.map((section, index) => (
              <div key={index} className="course-section">
                <h3 className="section-title">{section.name || `Section ${index + 1}`}</h3>
                {section.summary && (
                  <div 
                    className="section-summary"
                    dangerouslySetInnerHTML={{ __html: section.summary }}
                  />
                )}
                <div className="modules-list">
                  {section.modules?.map(module => (
                    <div key={module.id} className="module-item">
                      <div className="module-icon">
                        {getModuleIcon(module.modname)}
                      </div>
                      <div className="module-info">
                        <a 
                          href={module.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="module-name"
                        >
                          {module.name}
                        </a>
                        {module.modname && (
                          <span className="module-type">{module.modname}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Discussion Tab */}
      {activeTab === 'discussion' && (
        <div className="course-discussion">
          <CreatePost 
            onPostCreated={handlePostCreated}
            courseId={parseInt(courseId)}
          />
          <div className="discussion-posts">
            {posts.length === 0 ? (
              <div className="no-posts">
                <p>No discussions yet. Start the conversation!</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div className="course-participants">
          {users.length === 0 ? (
            <p className="no-content">No participants found</p>
          ) : (
            <div className="participants-grid">
              {users.map(user => (
                <div key={user.id} className="participant-item">
                  <img 
                    src={user.profileimageurl || '/default-avatar.png'} 
                    alt={user.fullname}
                    className="participant-avatar"
                  />
                  <div className="participant-info">
                    <span className="participant-name">{user.fullname}</span>
                    <span className="participant-role">
                      {user.roles?.map(r => r.shortname).join(', ') || 'Student'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
