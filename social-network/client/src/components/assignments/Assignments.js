import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as assignmentService from '../../services/assignmentService';
import Avatar from '../common/Avatar';
import Loading from '../common/Loading';
import './Assignments.css';

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    visibility: 'private'
  });
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await assignmentService.getAssignments({ status: statusFilter });
      setAssignments(data.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await assignmentService.createAssignment(newAssignment);
      setShowCreateModal(false);
      setNewAssignment({
        title: '',
        description: '',
        dueDate: '',
        visibility: 'private'
      });
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    try {
      await assignmentService.addTask(selectedAssignment._id, newTask);
      setNewTask({ title: '', description: '' });
      // Refresh the selected assignment
      const { data } = await assignmentService.getAssignment(selectedAssignment._id);
      setSelectedAssignment(data.data);
      fetchAssignments();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    if (!selectedAssignment) return;
    try {
      await assignmentService.updateTask(selectedAssignment._id, taskId, { status: newStatus });
      const { data } = await assignmentService.getAssignment(selectedAssignment._id);
      setSelectedAssignment(data.data);
      fetchAssignments();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleUpdateStatus = async (assignmentId, newStatus) => {
    try {
      await assignmentService.updateAssignment(assignmentId, { status: newStatus });
      fetchAssignments();
      if (selectedAssignment?._id === assignmentId) {
        const { data } = await assignmentService.getAssignment(assignmentId);
        setSelectedAssignment(data.data);
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return '#6b7280';
      case 'in_progress': return '#3b82f6';
      case 'review': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'submitted': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="assignments-page">
      <div className="assignments-container">
        {/* Left Panel - Assignment List */}
        <div className="assignments-list-panel">
          <div className="panel-header">
            <h2>Collaborative Assignments</h2>
            <button 
              className="create-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>

          <div className="filter-bar">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>

          {loading ? (
            <Loading text="Loading assignments..." />
          ) : (
            <div className="assignments-list">
              {assignments.length === 0 ? (
                <div className="no-assignments">
                  <i className="fas fa-clipboard-list"></i>
                  <p>No assignments yet</p>
                  <button onClick={() => setShowCreateModal(true)}>Create one</button>
                </div>
              ) : (
                assignments.map(assignment => {
                  const daysUntilDue = getDaysUntilDue(assignment.dueDate);
                  
                  return (
                    <div 
                      key={assignment._id} 
                      className={`assignment-item ${selectedAssignment?._id === assignment._id ? 'active' : ''}`}
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      <div className="assignment-header">
                        <h4>{assignment.title}</h4>
                        <span 
                          className="status-badge"
                          style={{ background: getStatusColor(assignment.status) }}
                        >
                          {assignment.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="assignment-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${assignment.progress}%` }}
                          ></div>
                        </div>
                        <span>{assignment.progress}%</span>
                      </div>
                      <div className="assignment-meta">
                        <div className="collaborators">
                          {assignment.collaborators?.slice(0, 3).map((c, i) => (
                            <Avatar key={i} user={c.user} size="small" />
                          ))}
                          {assignment.collaborators?.length > 3 && (
                            <span className="more">+{assignment.collaborators.length - 3}</span>
                          )}
                        </div>
                        {assignment.dueDate && (
                          <span className={`due-date ${daysUntilDue !== null && daysUntilDue <= 3 ? 'urgent' : ''}`}>
                            <i className="fas fa-clock"></i>
                            {daysUntilDue !== null && daysUntilDue <= 0 
                              ? 'Overdue' 
                              : daysUntilDue !== null && daysUntilDue <= 7 
                                ? `${daysUntilDue} days` 
                                : formatDate(assignment.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Assignment Details */}
        <div className="assignment-detail-panel">
          {selectedAssignment ? (
            <>
              <div className="detail-header">
                <div className="title-section">
                  <h2>{selectedAssignment.title}</h2>
                  <span 
                    className="status-badge large"
                    style={{ background: getStatusColor(selectedAssignment.status) }}
                  >
                    {selectedAssignment.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="detail-actions">
                  <select 
                    value={selectedAssignment.status}
                    onChange={(e) => handleUpdateStatus(selectedAssignment._id, e.target.value)}
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                    <option value="submitted">Submitted</option>
                  </select>
                </div>
              </div>

              {selectedAssignment.description && (
                <div className="detail-description">
                  <p>{selectedAssignment.description}</p>
                </div>
              )}

              <div className="detail-info">
                <div className="info-item">
                  <i className="fas fa-calendar"></i>
                  <span>Due: {selectedAssignment.dueDate ? formatDate(selectedAssignment.dueDate) : 'No due date'}</span>
                </div>
                <div className="info-item">
                  <i className="fas fa-users"></i>
                  <span>{selectedAssignment.collaborators?.length || 0} collaborators</span>
                </div>
                <div className="info-item">
                  <i className="fas fa-tasks"></i>
                  <span>{selectedAssignment.tasks?.filter(t => t.status === 'completed').length || 0}/{selectedAssignment.tasks?.length || 0} tasks</span>
                </div>
              </div>

              {/* Collaborators */}
              <div className="detail-section">
                <h3>Collaborators</h3>
                <div className="collaborators-list">
                  {selectedAssignment.collaborators?.map((c, i) => (
                    <div key={i} className="collaborator-item">
                      <Avatar user={c.user} size="medium" />
                      <div className="collaborator-info">
                        <span className="name">{c.user?.username}</span>
                        <span className="role">{c.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks */}
              <div className="detail-section">
                <h3>Tasks</h3>
                <form className="add-task-form" onSubmit={handleAddTask}>
                  <input
                    type="text"
                    placeholder="Add a new task..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    required
                  />
                  <button type="submit">
                    <i className="fas fa-plus"></i>
                  </button>
                </form>
                <div className="tasks-list">
                  {selectedAssignment.tasks?.length === 0 ? (
                    <p className="no-tasks">No tasks yet. Add one above!</p>
                  ) : (
                    selectedAssignment.tasks?.map(task => (
                      <div key={task._id} className={`task-item ${task.status}`}>
                        <div className="task-checkbox">
                          <input 
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={(e) => handleUpdateTaskStatus(
                              task._id, 
                              e.target.checked ? 'completed' : 'todo'
                            )}
                          />
                        </div>
                        <div className="task-content">
                          <span className="task-title">{task.title}</span>
                          {task.assignedTo?.length > 0 && (
                            <div className="task-assignees">
                              {task.assignedTo.map((a, i) => (
                                <Avatar key={i} user={a} size="tiny" />
                              ))}
                            </div>
                          )}
                        </div>
                        <select 
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                          className="task-status-select"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity Log */}
              <div className="detail-section">
                <h3>Activity</h3>
                <div className="activity-log">
                  {selectedAssignment.activityLog?.slice(0, 10).map((activity, i) => (
                    <div key={i} className="activity-item">
                      <Avatar user={activity.user} size="small" />
                      <div className="activity-content">
                        <span className="activity-text">
                          <strong>{activity.user?.username}</strong> {activity.details}
                        </span>
                        <span className="activity-time">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <i className="fas fa-clipboard-list"></i>
              <h3>Select an Assignment</h3>
              <p>Click on an assignment to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Assignment</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateAssignment}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                  placeholder="Assignment title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  placeholder="Describe the assignment..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Visibility</label>
                <select 
                  value={newAssignment.visibility}
                  onChange={(e) => setNewAssignment({...newAssignment, visibility: e.target.value})}
                >
                  <option value="private">Private</option>
                  <option value="group">Group Only</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
