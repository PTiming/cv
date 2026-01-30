# Moodle Interaction API (MERN Stack)

A full-stack application for interacting with Moodle Learning Management System using the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

### Backend API
- **Authentication**: User registration, login, and JWT-based authentication
- **Moodle Integration**: Connect to any Moodle instance using Web Services tokens
- **Course Management**: Fetch courses, course contents, and sync with Moodle
- **User Management**: User CRUD operations and enrollment tracking
- **Activity Tracking**: Track course activities, grades, and completion status
- **Messaging**: Send and receive messages through Moodle
- **Calendar**: Access calendar events from Moodle

### Frontend Application
- **Modern React UI**: Clean, responsive interface built with React
- **Dashboard**: Overview of enrolled courses and statistics
- **Course Browser**: Browse and view detailed course contents
- **Settings**: Manage Moodle connection and user preferences
- **Protected Routes**: Secure authentication flow

## Project Structure

```
moodle-api/
├── backend/
│   ├── config/
│   │   ├── config.js       # Application configuration
│   │   └── db.js           # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── moodleController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js         # Authentication middleware
│   │   └── validate.js     # Request validation
│   ├── models/
│   │   ├── Activity.js
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── moodle.js
│   │   └── users.js
│   ├── services/
│   │   └── moodleService.js # Moodle Web Services client
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActivityItem.js
│   │   │   ├── CourseCard.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── Navbar.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useMoodle.js
│   │   ├── pages/
│   │   │   ├── CourseDetail.js
│   │   │   ├── Courses.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── Settings.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── moodleService.js
│   │   ├── App.css
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- A Moodle instance with Web Services enabled

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd moodle-api/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/moodle_api
   JWT_SECRET=your_secure_jwt_secret_here
   JWT_EXPIRE=30d
   MOODLE_URL=https://your-moodle-instance.com
   MOODLE_TOKEN=your_moodle_web_service_token
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd moodle-api/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (optional):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/connect-moodle` | Connect Moodle account |
| GET | `/api/auth/logout` | Logout user |

### Moodle Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/moodle/site-info` | Get Moodle site info |
| GET | `/api/moodle/my-courses` | Get user's courses |
| GET | `/api/moodle/courses/:courseId/contents` | Get course contents |
| GET | `/api/moodle/courses/:courseId/grades` | Get course grades |
| GET | `/api/moodle/courses/:courseId/completion` | Get completion status |
| GET | `/api/moodle/assignments` | Get assignments |
| GET | `/api/moodle/quizzes` | Get quizzes |
| GET | `/api/moodle/forums` | Get forums |
| GET | `/api/moodle/calendar` | Get calendar events |
| POST | `/api/moodle/activities/:cmid/complete` | Mark activity complete |
| GET | `/api/moodle/messages` | Get messages |
| POST | `/api/moodle/messages` | Send message |

### Courses (Local DB)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | Get all courses |
| GET | `/api/courses/:id` | Get single course |
| GET | `/api/courses/moodle/:moodleId` | Get course by Moodle ID |
| POST | `/api/courses/sync` | Sync courses from Moodle (Admin) |
| POST | `/api/courses` | Create course (Admin) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (Admin) |
| GET | `/api/users/:id` | Get single user (Admin) |
| PUT | `/api/users/:id` | Update user (Admin) |
| DELETE | `/api/users/:id` | Delete user (Admin) |
| GET | `/api/users/:id/enrollments` | Get user enrollments |

## Moodle Configuration

### Enabling Web Services in Moodle

1. Log in to Moodle as an administrator
2. Go to **Site administration → Advanced features**
3. Enable **Web services**
4. Go to **Site administration → Plugins → Web services → Overview**
5. Follow the setup wizard to:
   - Enable REST protocol
   - Create a custom service or use built-in functions
   - Create a token for the user/service

### Required Web Service Functions

The following Moodle Web Service functions should be enabled:

- `core_webservice_get_site_info`
- `core_user_get_users_by_field`
- `core_user_create_users`
- `core_user_update_users`
- `core_course_get_courses`
- `core_course_get_courses_by_field`
- `core_course_get_contents`
- `core_course_create_courses`
- `core_enrol_get_enrolled_users`
- `core_enrol_get_users_courses`
- `enrol_manual_enrol_users`
- `enrol_manual_unenrol_users`
- `gradereport_user_get_grade_items`
- `mod_assign_get_assignments`
- `mod_assign_get_submissions`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_user_attempts`
- `mod_forum_get_forums_by_courses`
- `mod_forum_get_forum_discussions`
- `mod_forum_add_discussion`
- `core_message_send_instant_messages`
- `core_message_get_messages`
- `core_calendar_get_calendar_events`
- `core_completion_get_course_completion_status`
- `core_completion_get_activities_completion_status`
- `core_completion_update_activity_completion_status_manually`

## Security Considerations

- Store sensitive data (JWT secrets, Moodle tokens) securely
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs
- Keep dependencies updated

## License

MIT License
