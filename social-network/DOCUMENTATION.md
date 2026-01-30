# EduConnect - Complete Documentation

A MERN Stack Social Network with Moodle LMS Integration

## Table of Contents
1. [Getting Started](#getting-started)
2. [Authentication System](#authentication-system)
3. [User Management](#user-management)
4. [Posts & Feed](#posts--feed)
5. [Comments](#comments)
6. [Groups & Communities](#groups--communities)
7. [Direct Messaging](#direct-messaging)
8. [Notifications](#notifications)
9. [Search](#search)
10. [Resources](#resources)
11. [Assignments](#assignments)
12. [Moodle LMS Integration](#moodle-lms-integration)
13. [Admin Dashboard](#admin-dashboard)
14. [File Uploads](#file-uploads)
15. [RBAC Roles & Permissions](#rbac-roles--permissions)
16. [API Reference](#api-reference)

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd social-network

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Configuration

Create `.env` file in `server/` directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/educonnect
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
MOODLE_URL=https://your-moodle.com
MOODLE_TOKEN=your-moodle-token
```

### Running the Application

```bash
# Terminal 1 - Start Backend
cd server
npm run dev

# Terminal 2 - Start Frontend
cd client
npm start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## Authentication System

### How It Works
EduConnect uses JWT (JSON Web Tokens) for authentication:

1. **Registration**: User submits form → Password hashed with bcrypt → User saved to MongoDB → JWT token returned
2. **Login**: User submits credentials → Password verified → JWT token returned
3. **Protected Routes**: Token sent in Authorization header → Middleware verifies token → Request proceeds

### Token Structure
```javascript
{
  id: "user_id",
  role: "user",
  iat: 1234567890,  // issued at
  exp: 1234568790   // expires at
}
```

### API Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## User Management

### Features
- View and edit user profiles
- Follow/unfollow other users
- View followers and following lists
- Search for users
- Online status tracking

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  avatar: String,
  coverPhoto: String,
  bio: String,
  location: String,
  website: String,
  role: ['user', 'student', 'instructor', 'moderator', 'admin'],
  followers: [ObjectId],
  following: [ObjectId],
  moodleLinked: Boolean,
  moodleUserId: String,
  moodleToken: String,
  isOnline: Boolean,
  lastActive: Date,
  isBanned: Boolean,
  createdAt: Date
}
```

### API Endpoints

#### Get User Profile
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Hello, I'm John!",
  "location": "New York",
  "website": "https://johndoe.com"
}
```

#### Follow User
```http
POST /api/users/:id/follow
Authorization: Bearer <token>
```

#### Unfollow User
```http
DELETE /api/users/:id/follow
Authorization: Bearer <token>
```

#### Get Followers
```http
GET /api/users/:id/followers
Authorization: Bearer <token>
```

#### Get Following
```http
GET /api/users/:id/following
Authorization: Bearer <token>
```

---

## Posts & Feed

### Features
- Create posts with text and images
- Edit and delete own posts
- Like/unlike posts
- Share posts
- Visibility settings (public, followers, private)
- Hashtag support

### Post Model
```javascript
{
  author: ObjectId (ref: User),
  content: String,
  images: [String],
  visibility: ['public', 'followers', 'private'],
  likes: [ObjectId],
  comments: [ObjectId],
  shares: [{ user: ObjectId, sharedAt: Date }],
  originalPost: ObjectId (for shares),
  group: ObjectId (for group posts),
  hashtags: [String],
  mentions: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### How Feed Works
1. Fetches posts from users you follow
2. Includes your own posts
3. Includes public posts based on relevance
4. Sorted by creation date (newest first)
5. Supports pagination

### API Endpoints

#### Get Feed
```http
GET /api/posts?page=1&limit=10
Authorization: Bearer <token>
```

#### Create Post
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello world! #firstpost",
  "visibility": "public",
  "images": ["url1", "url2"]
}
```

#### Like/Unlike Post
```http
POST /api/posts/:id/like
Authorization: Bearer <token>
```

#### Share Post
```http
POST /api/posts/:id/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Check this out!"
}
```

#### Delete Post
```http
DELETE /api/posts/:id
Authorization: Bearer <token>
```

---

## Comments

### Features
- Add comments to posts
- Nested replies (parent-child)
- Like comments
- Edit/delete own comments
- Mention users with @username

### Comment Model
```javascript
{
  post: ObjectId (ref: Post),
  author: ObjectId (ref: User),
  content: String,
  parentComment: ObjectId (for replies),
  likes: [ObjectId],
  mentions: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

#### Add Comment
```http
POST /api/posts/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great post!",
  "parentComment": null  // or comment ID for reply
}
```

#### Edit Comment
```http
PUT /api/comments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated comment"
}
```

#### Like Comment
```http
POST /api/comments/:id/like
Authorization: Bearer <token>
```

#### Delete Comment
```http
DELETE /api/comments/:id
Authorization: Bearer <token>
```

---

## Groups & Communities

### Features
- Create groups with different privacy levels
- Join/leave groups
- Request to join private groups
- Admin/moderator management
- Group-specific posts
- Study groups linked to courses

### Group Types
- **General**: Standard social groups
- **Study**: Study groups for academic collaboration
- **Course**: Linked to Moodle courses

### Privacy Levels
- **Public**: Anyone can see and join
- **Private**: Visible but requires approval to join
- **Secret**: Invisible to non-members

### Group Model
```javascript
{
  name: String,
  description: String,
  type: ['general', 'study', 'course'],
  privacy: ['public', 'private', 'secret'],
  avatar: String,
  coverPhoto: String,
  creator: ObjectId,
  admins: [ObjectId],
  moderators: [ObjectId],
  members: [ObjectId],
  pendingMembers: [ObjectId],
  courseId: String (for course groups),
  topics: [String] (for study groups),
  createdAt: Date
}
```

### API Endpoints

#### List Groups
```http
GET /api/groups?type=general&search=study
Authorization: Bearer <token>
```

#### Create Group
```http
POST /api/groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "JavaScript Study Group",
  "description": "Learning JS together",
  "type": "study",
  "privacy": "public",
  "topics": ["JavaScript", "Web Development"]
}
```

#### Join Group
```http
POST /api/groups/:id/join
Authorization: Bearer <token>
```

#### Leave Group
```http
DELETE /api/groups/:id/leave
Authorization: Bearer <token>
```

#### Get Group Posts
```http
GET /api/groups/:id/posts
Authorization: Bearer <token>
```

#### Create Group Post
```http
POST /api/groups/:id/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello group members!"
}
```

---

## Direct Messaging

### Features
- Real-time private messaging using Socket.IO
- One-on-one and group conversations
- Typing indicators
- Read receipts
- Online status
- Message history with pagination

### How Real-Time Messaging Works
1. Client connects to Socket.IO server
2. User joins their personal room (user ID)
3. When sending message:
   - Message saved to database
   - Socket emits to recipient's room
   - Recipient receives instantly
4. Typing indicators sent via socket events
5. Read receipts update message status

### Conversation Model
```javascript
{
  participants: [ObjectId],
  isGroup: Boolean,
  groupName: String,
  lastMessage: ObjectId,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  conversation: ObjectId,
  sender: ObjectId,
  content: String,
  readBy: [{ user: ObjectId, readAt: Date }],
  createdAt: Date
}
```

### API Endpoints

#### Get Conversations
```http
GET /api/messages/conversations
Authorization: Bearer <token>
```

#### Get Messages
```http
GET /api/messages/:conversationId?page=1&limit=50
Authorization: Bearer <token>
```

#### Send Message
```http
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationId": "...",  // or recipientId for new conversation
  "content": "Hello!"
}
```

#### Mark as Read
```http
PUT /api/messages/:conversationId/read
Authorization: Bearer <token>
```

### Socket.IO Events

**Client → Server:**
```javascript
// Join personal room
socket.emit('join', userId);

// Send message
socket.emit('sendMessage', {
  conversationId: '...',
  content: 'Hello!'
});

// Typing indicator
socket.emit('typing', {
  conversationId: '...',
  isTyping: true
});
```

**Server → Client:**
```javascript
// Receive message
socket.on('newMessage', (message) => {
  // Handle new message
});

// Typing indicator
socket.on('userTyping', ({ conversationId, userId, isTyping }) => {
  // Show/hide typing indicator
});

// Online status
socket.on('userOnline', (userId) => {
  // Update user status
});
```

---

## Notifications

### Features
- Real-time notifications via Socket.IO
- Multiple notification types
- Mark as read (individual or all)
- Notification badge count

### Notification Types
- `like` - Someone liked your post/comment
- `comment` - Someone commented on your post
- `follow` - Someone followed you
- `mention` - Someone mentioned you
- `group_invite` - Invited to join a group
- `group_join_request` - Someone requested to join your group
- `message` - New message received
- `assignment` - Assignment update
- `resource` - New shared resource

### Notification Model
```javascript
{
  recipient: ObjectId,
  sender: ObjectId,
  type: String,
  post: ObjectId,
  comment: ObjectId,
  group: ObjectId,
  message: String,
  read: Boolean,
  createdAt: Date
}
```

### API Endpoints

#### Get Notifications
```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer <token>
```

#### Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <token>
```

#### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

### Socket.IO Events
```javascript
// Receive notification
socket.on('notification', (notification) => {
  // Show notification toast
  // Update badge count
});
```

---

## Search

### Features
- Full-text search across posts, users, groups, resources
- Hashtag search
- Search suggestions (autocomplete)
- Recent search history
- Trending hashtags

### How Search Works
1. MongoDB text indexes on searchable fields
2. Regex matching for partial searches
3. Hashtag extraction from posts
4. Aggregation for trending topics

### API Endpoints

#### Global Search
```http
GET /api/search?q=javascript&type=all
Authorization: Bearer <token>

# type options: all, posts, users, groups, resources
```

Response:
```json
{
  "posts": [...],
  "users": [...],
  "groups": [...],
  "resources": [...]
}
```

#### Search Suggestions
```http
GET /api/search/suggestions?q=jav
Authorization: Bearer <token>
```

#### Trending Hashtags
```http
GET /api/search/trending
Authorization: Bearer <token>
```

#### Recent Searches
```http
GET /api/search/recent
Authorization: Bearer <token>
```

#### Save Search
```http
POST /api/search/recent
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "javascript"
}
```

---

## Resources

### Features
- Share course materials and notes
- Multiple resource types: documents, videos, images, links, notes
- Like and save resources
- Comments on resources
- Download tracking
- Tag-based organization
- Group-specific resources

### Resource Types
- `document` - PDFs, Word docs, presentations
- `video` - Video files and links
- `image` - Images and diagrams
- `link` - External URLs
- `note` - Text-based notes

### Resource Model
```javascript
{
  title: String,
  description: String,
  type: ['document', 'video', 'image', 'link', 'note'],
  url: String,
  fileSize: Number,
  author: ObjectId,
  group: ObjectId,
  course: String,
  tags: [String],
  likes: [ObjectId],
  saves: [ObjectId],
  downloads: Number,
  views: Number,
  comments: [{
    user: ObjectId,
    content: String,
    createdAt: Date
  }],
  createdAt: Date
}
```

### API Endpoints

#### List Resources
```http
GET /api/resources?type=document&tags=javascript&group=groupId
Authorization: Bearer <token>
```

#### Create Resource
```http
POST /api/resources
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "JavaScript Basics",
  "description": "Introduction to JS",
  "type": "document",
  "url": "/uploads/documents/file.pdf",
  "tags": ["javascript", "programming"],
  "group": "groupId"
}
```

#### Like Resource
```http
POST /api/resources/:id/like
Authorization: Bearer <token>
```

#### Save Resource
```http
POST /api/resources/:id/save
Authorization: Bearer <token>
```

#### Add Comment
```http
POST /api/resources/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Very helpful!"
}
```

#### Download Resource
```http
GET /api/resources/:id/download
Authorization: Bearer <token>
```

---

## Assignments

### Features
- Create collaborative assignments
- Task breakdown and tracking
- Progress visualization
- Multiple collaborator roles
- Activity logging
- Due date tracking
- Discussion threads

### Collaborator Roles
- `owner` - Full control, can delete assignment
- `editor` - Can edit tasks and content
- `viewer` - Read-only access

### Assignment Model
```javascript
{
  title: String,
  description: String,
  dueDate: Date,
  course: String,
  group: ObjectId,
  owner: ObjectId,
  collaborators: [{
    user: ObjectId,
    role: ['owner', 'editor', 'viewer'],
    joinedAt: Date
  }],
  tasks: [{
    title: String,
    description: String,
    assignee: ObjectId,
    status: ['todo', 'in-progress', 'completed'],
    dueDate: Date,
    completedAt: Date
  }],
  status: ['draft', 'active', 'completed', 'archived'],
  progress: Number (0-100),
  activity: [{
    user: ObjectId,
    action: String,
    details: String,
    createdAt: Date
  }],
  discussion: [{
    user: ObjectId,
    content: String,
    createdAt: Date
  }],
  createdAt: Date
}
```

### API Endpoints

#### List Assignments
```http
GET /api/assignments?status=active&course=CS101
Authorization: Bearer <token>
```

#### Create Assignment
```http
POST /api/assignments
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Group Project",
  "description": "Build a web app",
  "dueDate": "2024-12-31",
  "course": "CS101",
  "tasks": [
    {
      "title": "Design UI",
      "description": "Create mockups",
      "dueDate": "2024-12-15"
    }
  ]
}
```

#### Add Task
```http
POST /api/assignments/:id/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Implement API",
  "description": "Build REST endpoints",
  "assignee": "userId",
  "dueDate": "2024-12-20"
}
```

#### Update Task Status
```http
PUT /api/assignments/:id/tasks/:taskId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```

#### Add Collaborator
```http
POST /api/assignments/:id/collaborators
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "...",
  "role": "editor"
}
```

#### Add Discussion Comment
```http
POST /api/assignments/:id/discussion
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great progress everyone!"
}
```

---

## Moodle LMS Integration

### Features
- Link Moodle account to EduConnect
- View enrolled courses
- Access course content
- Track assignments and grades
- Sync deadlines to calendar
- Course-specific discussions

### How It Works
1. User enters Moodle credentials
2. System authenticates with Moodle API
3. Moodle token stored securely
4. API calls fetch course data
5. Data displayed in EduConnect interface

### API Endpoints

#### Link Moodle Account
```http
POST /api/moodle/link
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "moodle_username",
  "password": "moodle_password"
}
```

#### Get Courses
```http
GET /api/moodle/courses
Authorization: Bearer <token>
```

#### Get Course Details
```http
GET /api/moodle/courses/:courseId
Authorization: Bearer <token>
```

#### Get Course Content
```http
GET /api/moodle/courses/:courseId/content
Authorization: Bearer <token>
```

#### Get Assignments
```http
GET /api/moodle/assignments
Authorization: Bearer <token>
```

#### Get Grades
```http
GET /api/moodle/grades
Authorization: Bearer <token>
```

#### Get Deadlines
```http
GET /api/moodle/deadlines
Authorization: Bearer <token>
```

#### Unlink Account
```http
DELETE /api/moodle/unlink
Authorization: Bearer <token>
```

---

## Admin Dashboard

### Features
- Platform statistics overview
- User management
- Role management
- Ban/unban users
- Content moderation
- View activity logs

### Admin Capabilities
| Action | Admin | Moderator |
|--------|-------|-----------|
| View all users | ✅ | ✅ |
| Change user role | ✅ | ❌ |
| Ban users | ✅ | ✅ |
| Delete users | ✅ | ❌ |
| View stats | ✅ | ✅ |
| Delete any post | ✅ | ✅ |

### API Endpoints

#### Get Platform Stats
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "users": {
    "total": 1000,
    "active": 950,
    "banned": 50,
    "moodleLinked": 800,
    "recentSignups": 100,
    "byRole": {
      "user": 800,
      "student": 150,
      "instructor": 30,
      "moderator": 15,
      "admin": 5
    }
  },
  "posts": {
    "total": 5000,
    "last7Days": [100, 120, 150, 80, 200, 180, 170]
  },
  "comments": {
    "total": 15000
  }
}
```

#### List Users
```http
GET /api/admin/users?page=1&limit=20&role=user&search=john
Authorization: Bearer <admin_token>
```

#### Get User Details
```http
GET /api/admin/users/:id
Authorization: Bearer <admin_token>
```

#### Change User Role
```http
PUT /api/admin/users/:id/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "moderator"
}
```

#### Ban User
```http
PUT /api/admin/users/:id/ban
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Violation of terms"
}
```

#### Unban User
```http
PUT /api/admin/users/:id/unban
Authorization: Bearer <admin_token>
```

#### Delete User
```http
DELETE /api/admin/users/:id
Authorization: Bearer <admin_token>
```

---

## File Uploads

### Features
- Image uploads for posts and profiles
- Document uploads for resources
- Video uploads
- Local file storage
- File type validation
- Size limits

### Configuration
```env
MAX_FILE_SIZE=10          # Max size in MB
UPLOAD_PATH=./uploads     # Storage directory
```

### Supported File Types
- **Images**: jpg, jpeg, png, gif, webp
- **Documents**: pdf, doc, docx, xls, xlsx, ppt, pptx, txt
- **Videos**: mp4, avi, mov, wmv, webm

### API Endpoints

#### Upload Image
```http
POST /api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>
```

#### Upload Multiple Images
```http
POST /api/upload/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

files: <image_files>  # max 10
```

#### Upload Document
```http
POST /api/upload/document
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <document_file>
```

#### Upload Video
```http
POST /api/upload/video
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <video_file>
```

#### Upload Profile Picture
```http
POST /api/upload/profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>
```

#### Delete File
```http
DELETE /api/upload/:filename
Authorization: Bearer <token>
```

---

## RBAC Roles & Permissions

### Role Hierarchy
```
Admin (4) > Moderator (3) > Instructor (2) > User/Student (1)
```

### Roles Description

#### User (Level 1)
Default role for new registrations.
- Create, edit, delete own posts
- Create, edit, delete own comments
- Follow/unfollow users
- Like posts and comments
- Send messages
- Join groups
- Search content

#### Student (Level 1)
Users linked to Moodle with student status.
- All User permissions
- Access course content
- View own grades
- Join study groups

#### Instructor (Level 2)
Users linked to Moodle with instructor status.
- All Student permissions
- Manage courses
- View all grades
- Create course groups
- Warn users

#### Moderator (Level 3)
Assigned by admin.
- All Instructor permissions
- Delete any post
- Delete any comment
- Ban users
- Review flagged content
- View analytics

#### Admin (Level 4)
Full system access.
- All Moderator permissions
- Change user roles
- Delete users
- Manage system settings
- View audit logs
- Edit any content

### Permission List
```javascript
const permissions = {
  // Posts
  'create_post': [1, 2, 3, 4],
  'edit_own_post': [1, 2, 3, 4],
  'delete_own_post': [1, 2, 3, 4],
  'edit_any_post': [4],
  'delete_any_post': [3, 4],
  
  // Comments
  'create_comment': [1, 2, 3, 4],
  'edit_own_comment': [1, 2, 3, 4],
  'delete_own_comment': [1, 2, 3, 4],
  'delete_any_comment': [2, 3, 4],
  
  // Users
  'view_users': [3, 4],
  'edit_own_profile': [1, 2, 3, 4],
  'edit_any_profile': [4],
  'ban_user': [3, 4],
  'unban_user': [3, 4],
  'change_user_role': [4],
  'delete_user': [4],
  
  // Moderation
  'flag_content': [1, 2, 3, 4],
  'review_flags': [3, 4],
  'warn_user': [2, 3, 4],
  
  // LMS
  'view_courses': [1, 2, 3, 4],
  'create_course_post': [2, 3, 4],
  'manage_course': [2, 3, 4],
  'view_all_grades': [2, 4],
  
  // Admin
  'view_analytics': [3, 4],
  'manage_settings': [4],
  'view_audit_log': [4]
};
```

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

### Rate Limits
- General API: 100 requests / 15 minutes
- Auth endpoints: 10 requests / 15 minutes
- Post creation: 30 posts / hour
- Comments: 60 comments / hour
- Follow actions: 100 / hour

### Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Server Error |

---

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```
Error: MongoNetworkError
```
**Solution**: Check MONGODB_URI in .env file

#### JWT Token Expired
```
Error: TokenExpiredError
```
**Solution**: Refresh token or login again

#### File Upload Failed
```
Error: File too large
```
**Solution**: Check MAX_FILE_SIZE in .env (default 10MB)

#### Socket.IO Connection Failed
**Solution**: Ensure CORS is configured correctly

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

---

## License

MIT License - see LICENSE file for details
