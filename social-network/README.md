# SocialLMS - MERN Social Network with Moodle LMS Integration

A full-featured social network application built with the MERN stack (MongoDB, Express.js, React, Node.js) that integrates with Moodle Learning Management System.

## Features

### Social Network Features
- **User Authentication**: Register, login, JWT-based authentication
- **User Profiles**: Customizable profiles with avatar, bio, location, website
- **Posts**: Create, edit, delete posts with visibility controls (public/followers/private)
- **News Feed**: Personalized feed showing posts from followed users
- **Comments**: Nested comments and replies on posts
- **Likes**: Like posts and comments
- **Shares**: Share posts with your followers
- **Follow System**: Follow/unfollow users
- **Notifications**: Real-time notifications via Socket.IO
- **User Search**: Search for users by username or name
- **Mentions**: @mention users in posts and comments

### Moodle LMS Integration
- **Account Linking**: Link your Moodle account securely
- **Course Access**: View all enrolled courses
- **Course Content**: Browse course sections, resources, and activities
- **Assignments**: View and track assignment deadlines
- **Grades**: Check your grades for courses
- **Discussion**: Course-specific discussion forums
- **Participants**: View classmates and instructors
- **Deadline Notifications**: Automatic notifications for upcoming deadlines
- **Quizzes**: View available quizzes
- **Forums**: Access course forums

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Socket.IO** - Real-time communication
- **Axios** - HTTP client for Moodle API

### Frontend
- **React 18** - UI library
- **React Router v6** - Routing
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client
- **React Icons** - Icon library
- **date-fns** - Date formatting

## Project Structure

```
social-network/
├── server/                 # Backend
│   ├── config/            # Configuration files
│   │   ├── db.js         # MongoDB connection
│   │   └── moodle.js     # Moodle API configuration
│   ├── controllers/       # Route controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   ├── commentController.js
│   │   ├── notificationController.js
│   │   └── moodleController.js
│   ├── middleware/        # Custom middleware
│   │   ├── auth.js
│   │   ├── validate.js
│   │   └── errorHandler.js
│   ├── models/            # Mongoose models
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   ├── Notification.js
│   │   ├── Conversation.js
│   │   └── Message.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── posts.js
│   │   ├── comments.js
│   │   ├── notifications.js
│   │   └── moodle.js
│   ├── services/          # Business logic services
│   │   └── moodleService.js
│   ├── index.js           # Entry point
│   └── package.json
│
└── client/                 # Frontend
    ├── public/
    │   ├── index.html
    │   └── manifest.json
    ├── src/
    │   ├── components/
    │   │   ├── auth/      # Authentication components
    │   │   ├── common/    # Shared components
    │   │   ├── feed/      # Feed and post components
    │   │   ├── profile/   # Profile components
    │   │   ├── notifications/
    │   │   └── moodle/    # Moodle integration components
    │   ├── context/       # React contexts
    │   │   ├── AuthContext.js
    │   │   └── SocketContext.js
    │   ├── services/      # API services
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── postService.js
    │   │   ├── userService.js
    │   │   ├── notificationService.js
    │   │   └── moodleService.js
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    └── package.json
```

## Installation

### Prerequisites
- Node.js v16 or higher
- MongoDB
- Moodle instance with Web Services enabled

### Backend Setup

1. Navigate to server directory:
```bash
cd social-network/server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/social_network
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_moodle_webservice_token
MOODLE_SERVICE=moodle_mobile_app
CLIENT_URL=http://localhost:3000
```

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to client directory:
```bash
cd social-network/client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

5. Start the development server:
```bash
npm start
```

## Moodle Configuration

To enable Moodle integration, you need to configure Web Services on your Moodle instance:

1. Enable Web Services in Site Administration > Plugins > Web services > Overview
2. Enable the REST protocol
3. Create a new external service with the following functions:
   - core_webservice_get_site_info
   - core_enrol_get_users_courses
   - core_course_get_contents
   - core_enrol_get_enrolled_users
   - core_user_get_users_by_field
   - gradereport_user_get_grade_items
   - mod_assign_get_assignments
   - mod_quiz_get_quizzes_by_courses
   - mod_forum_get_forums_by_courses
   - core_calendar_get_calendar_events
4. Create a token for the service

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/link-moodle` - Link Moodle account
- `POST /api/auth/unlink-moodle` - Unlink Moodle account
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/suggestions` - Get follow suggestions
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/:username/follow` - Follow user
- `DELETE /api/users/:username/follow` - Unfollow user
- `GET /api/users/:username/followers` - Get followers
- `GET /api/users/:username/following` - Get following
- `GET /api/users/:username/posts` - Get user posts

### Posts
- `GET /api/posts/feed` - Get news feed
- `GET /api/posts/explore` - Get explore posts
- `GET /api/posts/search` - Search posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `DELETE /api/posts/:id/like` - Unlike post
- `POST /api/posts/:id/share` - Share post
- `GET /api/posts/course/:courseId` - Get course posts

### Comments
- `POST /api/posts/:postId/comments` - Add comment
- `GET /api/posts/:postId/comments` - Get comments
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Like comment
- `DELETE /api/comments/:id/like` - Unlike comment

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Moodle
- `GET /api/moodle/courses` - Get enrolled courses
- `GET /api/moodle/courses/:courseId/contents` - Get course contents
- `GET /api/moodle/courses/:courseId/users` - Get course users
- `GET /api/moodle/courses/:courseId/grades` - Get course grades
- `GET /api/moodle/courses/:courseId/forums` - Get course forums
- `GET /api/moodle/courses/:courseId/quizzes` - Get course quizzes
- `GET /api/moodle/assignments` - Get all assignments
- `GET /api/moodle/deadlines` - Get upcoming deadlines
- `POST /api/moodle/sync-notifications` - Sync Moodle notifications

## Real-time Features

The application uses Socket.IO for real-time features:
- New notification alerts
- New message notifications
- Typing indicators in conversations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
