// Moodle LMS Configuration
module.exports = {
  baseUrl: process.env.MOODLE_URL || 'https://your-moodle-instance.com',
  token: process.env.MOODLE_TOKEN || '',
  service: process.env.MOODLE_SERVICE || 'moodle_mobile_app',
  
  // Common Moodle Web Service Functions
  functions: {
    getSiteInfo: 'core_webservice_get_site_info',
    getUserCourses: 'core_enrol_get_users_courses',
    getCourseContents: 'core_course_get_contents',
    getEnrolledUsers: 'core_enrol_get_enrolled_users',
    getUserInfo: 'core_user_get_users_by_field',
    getGrades: 'gradereport_user_get_grade_items',
    getAssignments: 'mod_assign_get_assignments',
    getQuizzes: 'mod_quiz_get_quizzes_by_courses',
    getForums: 'mod_forum_get_forums_by_courses',
    getCalendarEvents: 'core_calendar_get_calendar_events',
    sendMessage: 'core_message_send_instant_messages',
    getMessages: 'core_message_get_messages',
    getNotifications: 'message_popup_get_popup_notifications'
  }
};
