// Moodle LMS Configuration
module.exports = {
  baseUrl: process.env.MOODLE_URL || 'https://your-moodle-instance.com',
  token: process.env.MOODLE_TOKEN || '',
  service: process.env.MOODLE_SERVICE || 'moodle_mobile_app',
  
  // Common Moodle Web Service Functions
  functions: {
    // READ Functions (Get data FROM Moodle)
    getSiteInfo: 'core_webservice_get_site_info',
    getUserCourses: 'core_enrol_get_users_courses',
    getCourseContents: 'core_course_get_contents',
    getEnrolledUsers: 'core_enrol_get_enrolled_users',
    getUserInfo: 'core_user_get_users_by_field',
    getGrades: 'gradereport_user_get_grade_items',
    getAssignments: 'mod_assign_get_assignments',
    getAssignmentSubmissions: 'mod_assign_get_submissions',
    getQuizzes: 'mod_quiz_get_quizzes_by_courses',
    getForums: 'mod_forum_get_forums_by_courses',
    getForumDiscussions: 'mod_forum_get_forum_discussions',
    getDiscussionPosts: 'mod_forum_get_discussion_posts',
    getCalendarEvents: 'core_calendar_get_calendar_events',
    getMessages: 'core_message_get_messages',
    getNotifications: 'message_popup_get_popup_notifications',
    
    // WRITE Functions (Send data TO Moodle)
    sendMessage: 'core_message_send_instant_messages',
    submitAssignment: 'mod_assign_save_submission',
    submitAssignmentForGrading: 'mod_assign_submit_for_grading',
    addForumPost: 'mod_forum_add_discussion_post',
    addForumDiscussion: 'mod_forum_add_discussion',
    createCalendarEvent: 'core_calendar_create_calendar_events',
    deleteCalendarEvent: 'core_calendar_delete_calendar_events',
    markNotificationRead: 'core_message_mark_notification_read',
    markMessagesRead: 'core_message_mark_all_messages_as_read',
    uploadFile: 'core_files_upload',
    updateUserPreferences: 'core_user_update_user_preferences'
  }
};
