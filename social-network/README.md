# MERN Social Network

A full-featured social network application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring real-time notifications and chat functionality.

## Features

### User Authentication
- User registration with email verification
- Secure login with JWT tokens
- Password hashing with bcrypt
- Protected routes

### Social Features
- **Posts**: Create, edit, delete posts with optional images
- **Comments**: Comment on posts
- **Likes**: Like/unlike posts and comments
- **Follow System**: Follow/unfollow users
- **User Profiles**: Customizable profiles with bio and avatar

### Real-time Features (Socket.io)
- **Real-time Notifications**: Instant notifications for:
  - Likes on your posts
  - Comments on your posts
  - New followers
  - New messages
- **Real-time Chat**:
  - Direct messaging between users
  - Typing indicators
  - Online/offline status
  - Message read receipts
- **Live Updates**: Posts and comments update in real-time

### Additional Features
- User search functionality
- Feed filtering (All posts / Following only)
- Responsive design
- Image uploads for posts and avatars

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **Context API** - State management
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client

## Project Structure

```
social-network/
├── backend/
│   ├── config/
│   │   ├── db.js           # Database configuration
│   │   └── socket.js       # Socket.io configuration
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication middleware
│   │   └── upload.js       # File upload middleware
│   ├── models/
│   │   ├── User.js         # User model
│   │   ├── Post.js         # Post model
│   │   ├── Comment.js      # Comment model
│   │   ├── Notification.js # Notification model
│   │   ├── Conversation.js # Conversation model
│   │   └── Message.js      # Message model
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── users.js        # User routes
│   │   ├── posts.js        # Post routes
│   │   ├── comments.js     # Comment routes
│   │   ├── notifications.js# Notification routes
│   │   └── chat.js         # Chat routes
│   ├── uploads/            # Uploaded files
│   ├── server.js           # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js   # Navigation bar
│   │   │   └── Post.js     # Post component
│   │   ├── context/
│   │   │   ├── AuthContext.js        # Authentication context
│   │   │   ├── NotificationContext.js# Notification context
│   │   │   └── ChatContext.js        # Chat context
│   │   ├── pages/
│   │   │   ├── Login.js    # Login page
│   │   │   ├── Register.js # Registration page
│   │   │   ├── Home.js     # Home feed page
│   │   │   ├── Profile.js  # User profile page
│   │   │   ├── Chat.js     # Chat page
│   │   │   └── Notifications.js # Notifications page
│   │   ├── services/
│   │   │   ├── api.js      # Axios instance
│   │   │   └── socket.js   # Socket.io service
│   │   ├── App.js          # Main app component
│   │   └── App.css         # Global styles
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd social-network
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Environment Setup**

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/social-network
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:3000
```

### Running the Application

1. **Start MongoDB** (if running locally)
```bash
mongod
```

2. **Start the backend server**
```bash
cd backend
npm start
```

3. **Start the frontend development server**
```bash
cd frontend
npm start
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar
- `POST /api/users/:id/follow` - Follow user
- `POST /api/users/:id/unfollow` - Unfollow user
- `GET /api/users/search/:query` - Search users

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/feed` - Get followed users' posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `POST /api/posts/:id/unlike` - Unlike post

### Comments
- `GET /api/comments/post/:postId` - Get post comments
- `POST /api/comments/:postId` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Like comment
- `POST /api/comments/:id/unlike` - Unlike comment

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications` - Delete all notifications

### Chat
- `GET /api/chat/conversations` - Get conversations
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message
- `DELETE /api/chat/conversations/:id` - Delete conversation
- `GET /api/chat/unread-count` - Get unread message count

## Socket.io Events

### Client to Server
- `conversation:join` - Join a conversation room
- `conversation:leave` - Leave a conversation room
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator

### Server to Client
- `notification:new` - New notification received
- `message:new` - New message received
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline

## Security Considerations

This implementation includes basic security features:
- JWT authentication with token expiration
- Password hashing with bcrypt
- Input validation with express-validator
- Protected routes

For production deployment, consider adding:
- **Rate limiting** (e.g., express-rate-limit) to prevent abuse
- **HTTPS** for encrypted communication
- **CORS** configuration for specific origins
- **Helmet.js** for HTTP security headers
- **Database connection pooling** for better performance
- **Input sanitization** to prevent XSS attacks
- **CSRF protection** for form submissions

## License

MIT License - feel free to use this project for learning or as a foundation for your own social network application.
