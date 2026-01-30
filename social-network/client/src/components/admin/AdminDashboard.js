import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUsers, FaChartLine, FaUserShield, FaBan, FaCheckCircle,
  FaSearch, FaFilter, FaEllipsisV, FaArrowLeft, FaUserGraduate,
  FaChalkboardTeacher, FaUserCog
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import Loading from '../common/Loading';
import adminService from '../../services/adminService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1
  });
  const [pagination, setPagination] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  // Check if user has admin/moderator access
  useEffect(() => {
    if (user && !['admin', 'moderator'].includes(user.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch users when filters change or tab is users
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, filters]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await adminService.getUsers(filters);
      if (response.success) {
        setUsers(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      fetchUsers();
      setActionMenu(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleBanUser = async (userId, reason = 'Violation of community guidelines') => {
    if (window.confirm('Are you sure you want to ban this user?')) {
      try {
        await adminService.banUser(userId, reason);
        fetchUsers();
        setActionMenu(null);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to ban user');
      }
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await adminService.unbanUser(userId);
      fetchUsers();
      setActionMenu(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to unban user');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <FaUserShield className="role-icon admin" />;
      case 'moderator': return <FaUserCog className="role-icon moderator" />;
      case 'instructor': return <FaChalkboardTeacher className="role-icon instructor" />;
      case 'student': return <FaUserGraduate className="role-icon student" />;
      default: return <FaUsers className="role-icon user" />;
    }
  };

  if (loading) {
    return <Loading text="Loading admin dashboard..." />;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <Link to="/" className="back-link">
              <FaArrowLeft />
              <span>Back to Feed</span>
            </Link>
            <h2>Admin Panel</h2>
          </div>
          
          <nav className="admin-nav">
            <button 
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FaChartLine />
              <span>Overview</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <FaUsers />
              <span>Users</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          {activeTab === 'overview' && stats && (
            <div className="overview-content">
              <h1>Dashboard Overview</h1>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon users">
                    <FaUsers />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.users.total}</span>
                    <span className="stat-label">Total Users</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon active">
                    <FaCheckCircle />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.users.active}</span>
                    <span className="stat-label">Active Users</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon banned">
                    <FaBan />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.users.banned}</span>
                    <span className="stat-label">Banned Users</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon moodle">
                    <FaUserGraduate />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.users.moodleLinked}</span>
                    <span className="stat-label">Moodle Linked</span>
                  </div>
                </div>
              </div>

              <div className="content-stats">
                <h2>Content Statistics</h2>
                <div className="content-grid">
                  <div className="content-stat">
                    <span className="content-value">{stats.content.totalPosts}</span>
                    <span className="content-label">Total Posts</span>
                  </div>
                  <div className="content-stat">
                    <span className="content-value">{stats.content.totalComments}</span>
                    <span className="content-label">Total Comments</span>
                  </div>
                  <div className="content-stat">
                    <span className="content-value">{stats.users.recentSignups}</span>
                    <span className="content-label">New Users (30d)</span>
                  </div>
                </div>
              </div>

              <div className="roles-breakdown">
                <h2>Users by Role</h2>
                <div className="roles-grid">
                  {Object.entries(stats.users.byRole || {}).map(([role, count]) => (
                    <div key={role} className="role-stat">
                      {getRoleIcon(role)}
                      <span className="role-name">{role}</span>
                      <span className="role-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-content">
              <h1>User Management</h1>
              
              <div className="users-toolbar">
                <div className="search-box">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  />
                </div>
                
                <div className="filter-group">
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>

              {usersLoading ? (
                <Loading text="Loading users..." />
              ) : (
                <>
                  <div className="users-table">
                    <div className="table-header">
                      <span className="col-user">User</span>
                      <span className="col-role">Role</span>
                      <span className="col-status">Status</span>
                      <span className="col-joined">Joined</span>
                      <span className="col-actions">Actions</span>
                    </div>
                    
                    {users.map(u => (
                      <div key={u._id} className="table-row">
                        <div className="col-user">
                          <Avatar src={u.avatar} alt={u.username} size="small" />
                          <div className="user-info">
                            <span className="user-name">
                              {u.firstName && u.lastName 
                                ? `${u.firstName} ${u.lastName}`
                                : u.username}
                            </span>
                            <span className="user-email">{u.email}</span>
                          </div>
                        </div>
                        
                        <div className="col-role">
                          <span className={`role-badge ${u.role}`}>
                            {getRoleIcon(u.role)}
                            {u.role}
                          </span>
                        </div>
                        
                        <div className="col-status">
                          <span className={`status-badge ${u.isActive ? 'active' : 'banned'}`}>
                            {u.isActive ? 'Active' : 'Banned'}
                          </span>
                        </div>
                        
                        <div className="col-joined">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                        
                        <div className="col-actions">
                          <button 
                            className="action-menu-btn"
                            onClick={() => setActionMenu(actionMenu === u._id ? null : u._id)}
                          >
                            <FaEllipsisV />
                          </button>
                          
                          {actionMenu === u._id && (
                            <>
                              <div className="menu-overlay" onClick={() => setActionMenu(null)} />
                              <div className="action-dropdown">
                                <Link to={`/profile/${u.username}`} className="dropdown-item">
                                  View Profile
                                </Link>
                                
                                {user?.role === 'admin' && u._id !== user._id && (
                                  <>
                                    <div className="dropdown-divider" />
                                    <div className="dropdown-label">Change Role</div>
                                    {['user', 'student', 'instructor', 'moderator'].map(role => (
                                      u.role !== role && (
                                        <button
                                          key={role}
                                          className="dropdown-item"
                                          onClick={() => handleRoleChange(u._id, role)}
                                        >
                                          Set as {role}
                                        </button>
                                      )
                                    ))}
                                  </>
                                )}
                                
                                {u._id !== user._id && (
                                  <>
                                    <div className="dropdown-divider" />
                                    {u.isActive ? (
                                      <button
                                        className="dropdown-item danger"
                                        onClick={() => handleBanUser(u._id)}
                                      >
                                        Ban User
                                      </button>
                                    ) : (
                                      <button
                                        className="dropdown-item success"
                                        onClick={() => handleUnbanUser(u._id)}
                                      >
                                        Unban User
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {pagination && pagination.pages > 1 && (
                    <div className="pagination">
                      <button
                        disabled={filters.page === 1}
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                      >
                        Previous
                      </button>
                      <span>Page {filters.page} of {pagination.pages}</span>
                      <button
                        disabled={filters.page === pagination.pages}
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
