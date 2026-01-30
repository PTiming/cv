# EduConnect API Documentation

> **Base URL:** `http://localhost:5000/api`

## 📊 API Summary

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Authentication | 8 | Login, register, tokens |
| Users | 9 | Profiles, follow system |
| Posts | 11 | Feed, CRUD, likes |
| Comments | 4 | CRUD, likes |
| Groups | 13 | Groups, study groups |
| Messages | 12 | Direct messaging |
| Notifications | 5 | Real-time alerts |
| Resources | 14 | Course materials |
| Assignments | 10 | Collaborative work |
| Search | 7 | Full-text search |
| Moodle | 9 | LMS integration |
| Admin | 6 | Dashboard, user mgmt |
| Upload | 6 | File uploads |
| **TOTAL** | **114** | |

---

## 🔐 Authentication Headers

Most endpoints require authentication. Include the JWT token in the header:

```
Authorization: ******
```

---

# 📋 API Endpoints

---

## 1. 🔐 Authentication (8 endpoints)

### 1.1 Register
```http
POST /api/auth/register
```
Create a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Validation:**
- `username`: 3-30 chars, alphanumeric + underscore
- `email`: valid email format
- `password`: min 6 characters
- `role`: "user", "student", or "instructor" (optional)

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "student",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### 1.2 Login
```http
POST /api/auth/login
```
Authenticate and receive a token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

---

### 1.3 Get Current User
```http
GET /api/auth/me
```
Get the authenticated user's profile.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "user": { ... }
}
```

---

### 1.4 Link Moodle Account
```http
POST /api/auth/link-moodle
```
Connect Moodle LMS account.

**Auth Required:** Yes

**Request Body:**
```json
{
  "moodleUsername": "moodle_user",
  "moodlePassword": "moodle_pass"
}
```

---

### 1.5 Unlink Moodle Account
```http
POST /api/auth/unlink-moodle
```
Disconnect Moodle account.

**Auth Required:** Yes

---

### 1.6 Refresh Token
```http
POST /api/auth/refresh
```
Get a new access token.

**Auth Required:** Yes

---

### 1.7 Logout
```http
POST /api/auth/logout
```
Invalidate current session.

**Auth Required:** Yes

---

### 1.8 Change Password
```http
PUT /api/auth/change-password
```
Update user password.

**Auth Required:** Yes

**Request Body:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

---

## 2. 👥 Users (9 endpoints)

### 2.1 Search Users
```http
GET /api/users/search?q=john&limit=10
```
Search for users by name or username.

---

### 2.2 Get Suggestions
```http
GET /api/users/suggestions
```
Get follow suggestions.

**Auth Required:** Yes

---

### 2.3 Get User Profile
```http
GET /api/users/:username
```
Get a user's public profile.

**Auth Required:** Optional (more data if authenticated)

---

### 2.4 Update Profile
```http
PUT /api/users/profile
```
Update your profile.

**Auth Required:** Yes

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Software developer",
  "location": "New York",
  "website": "https://example.com"
}
```

---

### 2.5 Follow User
```http
POST /api/users/:username/follow
```
Follow a user.

**Auth Required:** Yes  
**Rate Limit:** 100 requests/hour

---

### 2.6 Unfollow User
```http
DELETE /api/users/:username/follow
```
Unfollow a user.

**Auth Required:** Yes  
**Rate Limit:** 100 requests/hour

---

### 2.7 Get Followers
```http
GET /api/users/:username/followers?page=1&limit=20
```
Get a user's followers list.

---

### 2.8 Get Following
```http
GET /api/users/:username/following?page=1&limit=20
```
Get users that someone follows.

---

### 2.9 Get User Posts
```http
GET /api/users/:username/posts?page=1&limit=10
```
Get posts by a specific user.

**Auth Required:** Optional

---

## 3. 📝 Posts (11 endpoints)

### 3.1 Get Feed
```http
GET /api/posts/feed?page=1&limit=10
```
Get personalized feed (posts from followed users).

**Auth Required:** Yes

---

### 3.2 Get Explore Posts
```http
GET /api/posts/explore?page=1&limit=10
```
Get public posts for discovery.

**Auth Required:** Optional

---

### 3.3 Search Posts
```http
GET /api/posts/search?q=keyword&page=1&limit=10
```
Search posts by content.

---

### 3.4 Get Course Posts
```http
GET /api/posts/course/:courseId
```
Get posts related to a Moodle course.

**Auth Required:** Yes

---

### 3.5 Create Post
```http
POST /api/posts
```
Create a new post.

**Auth Required:** Yes  
**Rate Limit:** 30 posts/hour

**Request Body:**
```json
{
  "content": "Hello world! #firstpost",
  "visibility": "public",
  "images": ["url1", "url2"],
  "courseId": "optional-moodle-course-id",
  "groupId": "optional-group-id"
}
```

**Visibility Options:** `public`, `followers`, `private`, `course`

---

### 3.6 Get Post
```http
GET /api/posts/:id
```
Get a single post by ID.

**Auth Required:** Optional

---

### 3.7 Update Post
```http
PUT /api/posts/:id
```
Edit your post.

**Auth Required:** Yes (owner only)

---

### 3.8 Delete Post
```http
DELETE /api/posts/:id
```
Delete your post.

**Auth Required:** Yes (owner or moderator)

---

### 3.9 Like Post
```http
POST /api/posts/:id/like
```
Like a post.

**Auth Required:** Yes

---

### 3.10 Unlike Post
```http
DELETE /api/posts/:id/like
```
Remove like from a post.

**Auth Required:** Yes

---

### 3.11 Share Post
```http
POST /api/posts/:id/share
```
Share/repost a post.

**Auth Required:** Yes  
**Rate Limit:** 30 posts/hour

**Request Body:**
```json
{
  "content": "Check this out!"
}
```

---

## 4. 💬 Comments (6 endpoints)

### 4.1 Add Comment
```http
POST /api/posts/:postId/comments
```
Add a comment to a post.

**Auth Required:** Yes  
**Rate Limit:** 60 comments/hour

**Request Body:**
```json
{
  "content": "Great post!",
  "parentId": "optional-parent-comment-id"
}
```

---

### 4.2 Get Comments
```http
GET /api/posts/:postId/comments?page=1&limit=20
```
Get comments for a post.

---

### 4.3 Update Comment
```http
PUT /api/comments/:id
```
Edit your comment.

**Auth Required:** Yes (owner only)

---

### 4.4 Delete Comment
```http
DELETE /api/comments/:id
```
Delete a comment.

**Auth Required:** Yes (owner or moderator)

---

### 4.5 Like Comment
```http
POST /api/comments/:id/like
```
Like a comment.

**Auth Required:** Yes

---

### 4.6 Unlike Comment
```http
DELETE /api/comments/:id/like
```
Unlike a comment.

**Auth Required:** Yes

---

## 5. 👥 Groups (13 endpoints)

### 5.1 Get My Groups
```http
GET /api/groups/my-groups
```
Get groups you're a member of.

**Auth Required:** Yes

---

### 5.2 Get Study Groups by Course
```http
GET /api/groups/course/:courseId
```
Get study groups linked to a Moodle course.

**Auth Required:** Yes

---

### 5.3 Get All Groups
```http
GET /api/groups?type=general&privacy=public&page=1&limit=10
```
List all accessible groups.

**Auth Required:** Yes

---

### 5.4 Create Group
```http
POST /api/groups
```
Create a new group.

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "Study Group",
  "description": "Group for CS101",
  "type": "study",
  "privacy": "public",
  "courseId": "optional-moodle-course-id",
  "topics": ["programming", "algorithms"]
}
```

**Types:** `general`, `study`, `course`  
**Privacy:** `public`, `private`, `secret`

---

### 5.5 Get Group
```http
GET /api/groups/:id
```
Get group details.

**Auth Required:** Yes

---

### 5.6 Update Group
```http
PUT /api/groups/:id
```
Update group settings.

**Auth Required:** Yes (admin only)

---

### 5.7 Delete Group
```http
DELETE /api/groups/:id
```
Delete a group.

**Auth Required:** Yes (creator only)

---

### 5.8 Join Group
```http
POST /api/groups/:id/join
```
Request to join a group.

**Auth Required:** Yes

---

### 5.9 Leave Group
```http
POST /api/groups/:id/leave
```
Leave a group.

**Auth Required:** Yes

---

### 5.10 Approve Join Request
```http
POST /api/groups/:id/approve/:userId
```
Approve pending member.

**Auth Required:** Yes (admin only)

---

### 5.11 Reject Join Request
```http
POST /api/groups/:id/reject/:userId
```
Reject pending member.

**Auth Required:** Yes (admin only)

---

### 5.12 Get Group Posts
```http
GET /api/groups/:id/posts?page=1&limit=10
```
Get posts in a group.

**Auth Required:** Yes (member only)

---

### 5.13 Create Group Post
```http
POST /api/groups/:id/posts
```
Post in a group.

**Auth Required:** Yes (member only)

---

## 6. 💌 Messages (12 endpoints)

### 6.1 Get Unread Count
```http
GET /api/messages/unread-count
```
Get total unread message count.

**Auth Required:** Yes

---

### 6.2 Search Users for Chat
```http
GET /api/messages/search-users?q=john
```
Search users to start a conversation.

**Auth Required:** Yes

---

### 6.3 Get Conversations
```http
GET /api/messages/conversations
```
Get all conversations.

**Auth Required:** Yes

---

### 6.4 Create Conversation
```http
POST /api/messages/conversations
```
Start a new conversation.

**Auth Required:** Yes

**Request Body:**
```json
{
  "participantId": "user-id",
  "isGroup": false,
  "groupName": "Chat Group"
}
```

---

### 6.5 Get Conversation
```http
GET /api/messages/conversations/:id
```
Get conversation details.

**Auth Required:** Yes

---

### 6.6 Update Conversation
```http
PUT /api/messages/conversations/:id
```
Update group chat settings.

**Auth Required:** Yes

---

### 6.7 Add Participant
```http
POST /api/messages/conversations/:id/participants
```
Add user to group chat.

**Auth Required:** Yes

---

### 6.8 Remove Participant
```http
DELETE /api/messages/conversations/:id/participants/:userId
```
Remove user from group chat.

**Auth Required:** Yes

---

### 6.9 Leave Conversation
```http
POST /api/messages/conversations/:id/leave
```
Leave a group conversation.

**Auth Required:** Yes

---

### 6.10 Get Messages
```http
GET /api/messages/conversations/:id/messages?page=1&limit=50
```
Get messages in a conversation.

**Auth Required:** Yes

---

### 6.11 Send Message
```http
POST /api/messages/conversations/:id/messages
```
Send a message.

**Auth Required:** Yes

**Request Body:**
```json
{
  "content": "Hello!",
  "messageType": "text",
  "attachment": "optional-file-url"
}
```

**Message Types:** `text`, `image`, `file`, `moodle_link`

---

### 6.12 Mark as Read
```http
POST /api/messages/conversations/:id/read
```
Mark messages as read.

**Auth Required:** Yes

---

### 6.13 Delete Message
```http
DELETE /api/messages/:messageId
```
Delete a message.

**Auth Required:** Yes (sender only)

---

## 7. 🔔 Notifications (5 endpoints)

### 7.1 Get Notifications
```http
GET /api/notifications?page=1&limit=20
```
Get your notifications.

**Auth Required:** Yes

---

### 7.2 Get Unread Count
```http
GET /api/notifications/unread-count
```
Get unread notification count.

**Auth Required:** Yes

---

### 7.3 Mark All as Read
```http
PUT /api/notifications/read-all
```
Mark all notifications as read.

**Auth Required:** Yes

---

### 7.4 Mark as Read
```http
PUT /api/notifications/:id/read
```
Mark single notification as read.

**Auth Required:** Yes

---

### 7.5 Delete Notification
```http
DELETE /api/notifications/:id
```
Delete a notification.

**Auth Required:** Yes

---

## 8. 📚 Resources (14 endpoints)

### 8.1 Get My Resources
```http
GET /api/resources/my-resources
```
Get resources you created.

**Auth Required:** Yes

---

### 8.2 Get Saved Resources
```http
GET /api/resources/saved
```
Get your saved/bookmarked resources.

**Auth Required:** Yes

---

### 8.3 Get Resources by Course
```http
GET /api/resources/course/:courseId
```
Get resources for a Moodle course.

**Auth Required:** Yes

---

### 8.4 Get All Resources
```http
GET /api/resources?type=document&visibility=public&tags=math&page=1
```
List all accessible resources.

**Auth Required:** Yes

---

### 8.5 Create Resource
```http
POST /api/resources
```
Upload/create a resource.

**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "Lecture Notes",
  "description": "Week 1 lecture notes",
  "type": "document",
  "visibility": "public",
  "url": "file-url-if-uploaded",
  "content": "text-content-if-note",
  "courseId": "optional-moodle-course-id",
  "groupId": "optional-group-id",
  "tags": ["lecture", "week1"]
}
```

**Types:** `document`, `link`, `video`, `image`, `note`, `other`  
**Visibility:** `public`, `group`, `private`

---

### 8.6 Get Resource
```http
GET /api/resources/:id
```
Get resource details.

**Auth Required:** Yes

---

### 8.7 Update Resource
```http
PUT /api/resources/:id
```
Update a resource.

**Auth Required:** Yes (owner only)

---

### 8.8 Delete Resource
```http
DELETE /api/resources/:id
```
Delete a resource.

**Auth Required:** Yes (owner only)

---

### 8.9 Like Resource
```http
POST /api/resources/:id/like
```
Like a resource.

**Auth Required:** Yes

---

### 8.10 Unlike Resource
```http
DELETE /api/resources/:id/like
```
Unlike a resource.

**Auth Required:** Yes

---

### 8.11 Save Resource
```http
POST /api/resources/:id/save
```
Bookmark a resource.

**Auth Required:** Yes

---

### 8.12 Unsave Resource
```http
DELETE /api/resources/:id/save
```
Remove bookmark.

**Auth Required:** Yes

---

### 8.13 Add Comment
```http
POST /api/resources/:id/comments
```
Comment on a resource.

**Auth Required:** Yes

---

### 8.14 Download Resource
```http
POST /api/resources/:id/download
```
Track download (increments counter).

**Auth Required:** Yes

---

## 9. 📋 Assignments (10 endpoints)

### 9.1 Get Assignments by Course
```http
GET /api/assignments/course/:courseId
```
Get collaborative assignments for a course.

**Auth Required:** Yes

---

### 9.2 Get All Assignments
```http
GET /api/assignments?status=in_progress&page=1&limit=10
```
Get your assignments.

**Auth Required:** Yes

---

### 9.3 Create Assignment
```http
POST /api/assignments
```
Create a collaborative assignment.

**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "Group Project",
  "description": "Build a web application",
  "visibility": "group",
  "dueDate": "2024-12-31T23:59:59Z",
  "courseId": "optional-moodle-course-id",
  "moodleAssignmentId": "optional-moodle-assignment-id",
  "groupId": "optional-group-id"
}
```

**Status Options:** `planning`, `in_progress`, `review`, `completed`, `submitted`

---

### 9.4 Get Assignment
```http
GET /api/assignments/:id
```
Get assignment details with tasks.

**Auth Required:** Yes (collaborator only)

---

### 9.5 Update Assignment
```http
PUT /api/assignments/:id
```
Update assignment.

**Auth Required:** Yes (owner/editor only)

---

### 9.6 Delete Assignment
```http
DELETE /api/assignments/:id
```
Delete assignment.

**Auth Required:** Yes (owner only)

---

### 9.7 Add Task
```http
POST /api/assignments/:id/tasks
```
Add a task to assignment.

**Auth Required:** Yes (owner/editor only)

**Request Body:**
```json
{
  "title": "Write introduction",
  "description": "Write 500 words",
  "assignee": "optional-user-id",
  "dueDate": "2024-12-15T23:59:59Z"
}
```

---

### 9.8 Update Task
```http
PUT /api/assignments/:id/tasks/:taskId
```
Update task (status, assignee, etc.).

**Auth Required:** Yes (owner/editor/assignee only)

---

### 9.9 Add Collaborator
```http
POST /api/assignments/:id/collaborators
```
Invite collaborator.

**Auth Required:** Yes (owner only)

**Request Body:**
```json
{
  "userId": "user-id",
  "role": "editor"
}
```

**Roles:** `editor`, `viewer`

---

### 9.10 Remove Collaborator
```http
DELETE /api/assignments/:id/collaborators/:userId
```
Remove collaborator.

**Auth Required:** Yes (owner only)

---

### 9.11 Add Discussion
```http
POST /api/assignments/:id/discussions
```
Add a discussion comment.

**Auth Required:** Yes (collaborator only)

---

### 9.12 Upload File
```http
POST /api/assignments/:id/files
```
Attach file to assignment.

**Auth Required:** Yes (owner/editor only)

---

## 10. 🔍 Search (7 endpoints)

### 10.1 Search
```http
GET /api/search?q=keyword&type=all&page=1&limit=10
```
Full-text search.

**Auth Required:** Yes

**Query Parameters:**
- `q`: Search query
- `type`: `all`, `posts`, `users`, `groups`, `resources`
- `page`: Page number
- `limit`: Results per page

---

### 10.2 Get Trending
```http
GET /api/search/trending
```
Get trending hashtags.

**Auth Required:** Yes

---

### 10.3 Get Suggestions
```http
GET /api/search/suggestions?q=joh
```
Get autocomplete suggestions.

**Auth Required:** Yes

---

### 10.4 Search by Hashtag
```http
GET /api/search/hashtag/:tag?page=1&limit=10
```
Get posts with specific hashtag.

**Auth Required:** Yes

---

### 10.5 Get Recent Searches
```http
GET /api/search/recent
```
Get your recent search history.

**Auth Required:** Yes

---

### 10.6 Save Recent Search
```http
POST /api/search/recent
```
Save a search to history.

**Auth Required:** Yes

---

### 10.7 Clear Recent Searches
```http
DELETE /api/search/recent
```
Clear search history.

**Auth Required:** Yes

---

## 11. 🎓 Moodle LMS (9 endpoints)

> **Note:** Requires linked Moodle account

### 11.1 Get Courses
```http
GET /api/moodle/courses
```
Get enrolled Moodle courses.

**Auth Required:** Yes + Moodle Link

---

### 11.2 Get Course Contents
```http
GET /api/moodle/courses/:courseId/contents
```
Get course modules and resources.

**Auth Required:** Yes + Moodle Link

---

### 11.3 Get Course Users
```http
GET /api/moodle/courses/:courseId/users
```
Get enrolled users in a course.

**Auth Required:** Yes + Moodle Link

---

### 11.4 Get Course Grades
```http
GET /api/moodle/courses/:courseId/grades
```
Get grades for a course.

**Auth Required:** Yes + Moodle Link

---

### 11.5 Get Course Forums
```http
GET /api/moodle/courses/:courseId/forums
```
Get discussion forums.

**Auth Required:** Yes + Moodle Link

---

### 11.6 Get Course Quizzes
```http
GET /api/moodle/courses/:courseId/quizzes
```
Get quizzes in a course.

**Auth Required:** Yes + Moodle Link

---

### 11.7 Get Assignments
```http
GET /api/moodle/assignments
```
Get all Moodle assignments.

**Auth Required:** Yes + Moodle Link

---

### 11.8 Get Deadlines
```http
GET /api/moodle/deadlines
```
Get upcoming deadlines.

**Auth Required:** Yes + Moodle Link

---

### 11.9 Sync Notifications
```http
POST /api/moodle/sync-notifications
```
Sync Moodle notifications to EduConnect.

**Auth Required:** Yes + Moodle Link

---

## 12. 🛡️ Admin (6 endpoints)

> **Note:** Requires Admin or Moderator role

### 12.1 Get Stats
```http
GET /api/admin/stats
```
Get platform statistics.

**Auth Required:** Yes  
**Permission:** VIEW_ANALYTICS

**Response:**
```json
{
  "users": {
    "total": 1000,
    "active": 800,
    "banned": 10,
    "moodleLinked": 500,
    "newThisMonth": 50,
    "byRole": { "user": 400, "student": 500, "instructor": 80, "admin": 20 }
  },
  "posts": { "total": 5000, "thisWeek": 200 },
  "comments": { "total": 15000 },
  "groups": { "total": 100, "active": 80 }
}
```

---

### 12.2 Get All Users
```http
GET /api/admin/users?role=student&isBanned=false&page=1&limit=20
```
List all users with filters.

**Auth Required:** Yes  
**Role:** Admin, Moderator

---

### 12.3 Get User by ID
```http
GET /api/admin/users/:id
```
Get detailed user info.

**Auth Required:** Yes  
**Role:** Admin, Moderator

---

### 12.4 Update User Role
```http
PUT /api/admin/users/:id/role
```
Change a user's role.

**Auth Required:** Yes  
**Role:** Admin only

**Request Body:**
```json
{
  "role": "instructor"
}
```

---

### 12.5 Ban User
```http
PUT /api/admin/users/:id/ban
```
Ban a user.

**Auth Required:** Yes  
**Role:** Admin, Moderator

**Request Body:**
```json
{
  "reason": "Violation of community guidelines"
}
```

---

### 12.6 Unban User
```http
PUT /api/admin/users/:id/unban
```
Unban a user.

**Auth Required:** Yes  
**Role:** Admin, Moderator

---

## 13. 📤 File Upload (6 endpoints)

### 13.1 Upload Image
```http
POST /api/upload/image
```
Upload a single image.

**Auth Required:** Yes  
**Content-Type:** multipart/form-data

**Form Field:** `image`

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "file": {
    "url": "http://localhost:5000/uploads/images/userId/filename.jpg",
    "filename": "filename.jpg",
    "originalName": "photo.jpg",
    "size": 102400,
    "mimetype": "image/jpeg"
  }
}
```

---

### 13.2 Upload Multiple Images
```http
POST /api/upload/images
```
Upload up to 10 images.

**Auth Required:** Yes  
**Form Field:** `images`

---

### 13.3 Upload Document
```http
POST /api/upload/document
```
Upload a document (PDF, DOC, etc.).

**Auth Required:** Yes  
**Form Field:** `document`

---

### 13.4 Upload Video
```http
POST /api/upload/video
```
Upload a video file.

**Auth Required:** Yes  
**Form Field:** `video`

---

### 13.5 Upload Profile Picture
```http
POST /api/upload/profile-picture
```
Upload a profile picture.

**Auth Required:** Yes  
**Form Field:** `avatar`

---

### 13.6 Delete File
```http
DELETE /api/upload/:filename?folder=images
```
Delete an uploaded file.

**Auth Required:** Yes (owner only)

---

## 🔌 WebSocket Events (Socket.IO)

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'JWT_TOKEN' }
});
```

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join` | Client→Server | Join user's room |
| `newNotification` | Server→Client | New notification |
| `sendMessage` | Client→Server | Send chat message |
| `newMessage` | Server→Client | Receive chat message |
| `typing` | Client→Server | User is typing |
| `userTyping` | Server→Client | Someone is typing |
| `messageRead` | Client→Server | Mark message read |
| `messagesRead` | Server→Client | Messages were read |
| `userOnline` | Server→Client | User came online |
| `userOffline` | Server→Client | User went offline |

---

## 📊 Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 100 requests / 15 min |
| Auth (login/register) | 10 requests / 15 min |
| Create Post | 30 posts / hour |
| Create Comment | 60 comments / hour |
| Follow/Unfollow | 100 requests / hour |

---

## ❌ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "msg": "Invalid email format" }
  ]
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

---

## 🔒 RBAC Roles

| Role | Level | Key Permissions |
|------|-------|-----------------|
| `user` | 1 | Basic social features |
| `student` | 1 | + Course access |
| `instructor` | 2 | + Course management, grades |
| `moderator` | 3 | + Content moderation, ban users |
| `admin` | 4 | Full system access |

---

## 📖 Quick Reference

### Total API Endpoints: 114

| Category | Count |
|----------|-------|
| Auth | 8 |
| Users | 9 |
| Posts | 11 |
| Comments | 6 |
| Groups | 13 |
| Messages | 13 |
| Notifications | 5 |
| Resources | 14 |
| Assignments | 12 |
| Search | 7 |
| Moodle | 9 |
| Admin | 6 |
| Upload | 6 |
