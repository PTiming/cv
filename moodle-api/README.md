# Moodle Integration API

A MERN stack REST API for integrating with Moodle Learning Management System (LMS). This API provides endpoints for managing users, courses, grades, and assignments through Moodle's Web Services.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Moodle Integration**: Connect with Moodle's Web Services API
- **Course Management**: List courses, enroll users, get course contents
- **Grade Management**: Retrieve and submit grades, sync grade data
- **Assignment Tracking**: Get assignments, submissions, and quiz attempts
- **Data Synchronization**: Sync Moodle data to local MongoDB database
- **Rate Limiting**: Protection against abuse with configurable rate limits

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Moodle instance with Web Services enabled

## Installation

1. Navigate to the server directory:
   ```bash
   cd moodle-api/server
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
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/moodle_integration
   JWT_SECRET=your_secure_jwt_secret
   JWT_EXPIRES_IN=7d
   MOODLE_URL=https://your-moodle-instance.com
   MOODLE_TOKEN=your_moodle_web_service_token
   ```

## Moodle Configuration

### Enable Web Services in Moodle

1. Go to Site administration > Plugins > Web services > Overview
2. Enable web services
3. Enable REST protocol
4. Create a new external service with the following functions:
   - `core_webservice_get_site_info`
   - `core_user_get_users_by_field`
   - `core_user_create_users`
   - `core_user_update_users`
   - `core_course_get_courses`
   - `core_course_get_courses_by_field`
   - `core_course_get_contents`
   - `core_enrol_get_users_courses`
   - `core_enrol_get_enrolled_users`
   - `enrol_manual_enrol_users`
   - `core_grades_get_grades`
   - `gradereport_user_get_grade_items`
   - `gradereport_user_get_grades_table`
   - `mod_assign_get_assignments`
   - `mod_assign_get_submissions`
   - `mod_assign_save_grade`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_user_attempts`

5. Create a user and generate a token for the external service

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| POST | `/api/auth/link-moodle` | Link Moodle account | Private |

### Courses

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/courses` | Get all courses | Private |
| GET | `/api/courses/:courseId` | Get single course | Private |
| GET | `/api/courses/:courseId/contents` | Get course contents | Private |
| GET | `/api/courses/my-courses` | Get current user's courses | Private |
| GET | `/api/courses/user/:userId` | Get user's courses | Private |
| GET | `/api/courses/:courseId/users` | Get enrolled users | Teacher/Admin |
| POST | `/api/courses/enroll` | Enroll user in course | Teacher/Admin |
| POST | `/api/courses/sync` | Sync courses from Moodle | Admin |

### Grades

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/grades?courseId=X` | Get grades for course | Private |
| GET | `/api/grades/my-grades/:courseId` | Get current user's grades | Private |
| GET | `/api/grades/items/:courseId` | Get grade items | Private |
| GET | `/api/grades/report/:courseId/:userId` | Get grade report | Private |
| POST | `/api/grades/submit` | Submit grade | Teacher/Admin |
| POST | `/api/grades/sync/:courseId` | Sync grades from Moodle | Admin |

### Assignments

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/assignments?courseIds=1,2,3` | Get assignments | Private |
| GET | `/api/assignments/:assignmentId/submissions` | Get submissions | Teacher/Admin |
| GET | `/api/assignments/quizzes/:courseId` | Get quizzes | Private |
| GET | `/api/assignments/quizzes/:quizId/my-attempts` | Get current user's attempts | Private |
| GET | `/api/assignments/quizzes/:quizId/attempts/:userId` | Get user's attempts | Teacher/Admin |

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/health` | API health check | Public |

## Request Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Courses (with auth token)
```bash
curl http://localhost:5000/api/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Link Moodle Account
```bash
curl -X POST http://localhost:5000/api/auth/link-moodle \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "moodleUserId": 123
  }'
```

## Data Models

### User
- `username`: String (required, unique)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `moodleUserId`: Number (Moodle user ID)
- `role`: Enum ['student', 'teacher', 'admin']
- `firstName`, `lastName`: String
- `isActive`: Boolean

### Course
- `moodleCourseId`: Number (required, unique)
- `shortName`: String (required)
- `fullName`: String (required)
- `summary`: String
- `categoryId`: Number
- `startDate`, `endDate`: Date
- `visible`: Boolean
- `enrolledUsers`: Array of User references

### Grade
- `user`: User reference (required)
- `course`: Course reference (required)
- `itemName`: String (required)
- `itemType`: Enum ['assignment', 'quiz', 'forum', 'manual', 'category', 'course']
- `grade`, `gradeMax`, `gradeMin`: Number
- `percentage`: Number
- `feedback`: String

## Error Handling

All errors return JSON responses with the following structure:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Rate Limiting

The API implements rate limiting to protect against abuse:

- **Authentication endpoints** (login/register): 10 requests per 15 minutes
- **General API endpoints**: 100 requests per 15 minutes
- **Sensitive operations** (grading, sync): 20 requests per 15 minutes

When rate limited, the API returns:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again after 15 minutes"
}
```

## Testing

```bash
npm test
```

## License

MIT
