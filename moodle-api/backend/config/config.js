module.exports = {
  moodle: {
    baseUrl: process.env.MOODLE_URL,
    token: process.env.MOODLE_TOKEN,
    webServicePath: '/webservice/rest/server.php',
    responseFormat: 'json'
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '30d'
  }
};
