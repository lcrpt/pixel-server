require('./services/passport');

const passport = require('passport');

const AuthentificationCtrl = require('./controllers/authentification');
const UsersCtrl = require('./controllers/users');
const PostCtrl = require('./controllers/posts');

const requireToken = passport.authenticate('jwt', { session: false });

module.exports = app => {
  app.post('/signUp', AuthentificationCtrl.signUp);
  app.post('/signIn', AuthentificationCtrl.signIn);

  app.get('/user', UsersCtrl.getUser);

  app.post('/post/create', requireToken, PostCtrl.createPost);
  app.get('/post/get', PostCtrl.getPost);
};
