# MERN Social Network

A full-stack social network application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

- **User Authentication**: Register, login, and logout with JWT-based authentication
- **User Profiles**: View and edit profiles, follow/unfollow users
- **Posts**: Create, read, and delete posts
- **Feed**: View posts from all users with pagination
- **Likes**: Like and unlike posts
- **Comments**: Add and delete comments on posts
- **Search**: Search for users by name
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
social-network/
├── backend/                 # Express.js API
│   ├── config/              # Database configuration
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Custom middleware (auth)
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   └── server.js            # Entry point
│
└── frontend/                # React application
    ├── public/              # Static files
    └── src/
        ├── components/      # React components
        │   ├── Auth/        # Login, Register
        │   ├── Layout/      # Navbar
        │   ├── Posts/       # Feed, PostCard, CreatePost
        │   ├── Profile/     # Profile, Settings
        │   └── common/      # Search
        ├── context/         # React Context (Auth)
        └── utils/           # API utilities
```

## Tech Stack

### Backend
- **Express.js**: Web framework for Node.js
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **express-validator**: Input validation

### Frontend
- **React**: UI library
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Context API**: State management

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd social-network/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/social_network
   JWT_SECRET=your_secure_jwt_secret_here
   ```

5. Start the server:
   ```bash
   npm start
   ```

The API will be running at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd social-network/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create a `.env` file to customize the API URL:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The application will be running at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update current user profile
- `PUT /api/users/:id/follow` - Follow/unfollow user
- `GET /api/users/:id/posts` - Get user's posts
- `GET /api/users/search?q=query` - Search users

### Posts
- `GET /api/posts` - Get all posts (paginated)
- `POST /api/posts` - Create a new post
- `GET /api/posts/:id` - Get a single post
- `DELETE /api/posts/:id` - Delete a post
- `PUT /api/posts/:id/like` - Like/unlike a post
- `POST /api/posts/:id/comments` - Add a comment
- `DELETE /api/posts/:id/comments/:commentId` - Delete a comment

## Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection string | - |
| JWT_SECRET | Secret key for JWT | - |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:5000/api |

## Screenshots

The application features a clean, modern UI with:
- Gradient-styled login/register pages
- Card-based post feed
- User profile pages with follower/following tabs
- Interactive like and comment functionality
- Mobile-responsive design

## License

MIT License
