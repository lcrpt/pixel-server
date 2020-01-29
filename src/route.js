require('./services/passport');

const passport = require('passport');

const AuthentificationCtrl = require('./controllers/authentification');
const UsersCtrl = require('./controllers/users');
const PostCtrl = require('./controllers/posts');

const requireToken = passport.authenticate('jwt', { session: false });

module.exports = app => {
  app.post('/signUp', AuthentificationCtrl.signUp);

  app.get('/secretRessources', requireToken, (req, res) => {
    res.send({ result: 'This is a secure content by sign in' });
  });

  app.post('/signIn', AuthentificationCtrl.signIn);

  app.get('/user', UsersCtrl.getUser);

  app.post('/post/create', requireToken, PostCtrl.createPost);
};
