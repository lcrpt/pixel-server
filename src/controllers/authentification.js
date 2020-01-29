const _ = require('lodash');
const jwt = require('jwt-simple');
const passport = require('passport');

const UserModel = require('../models/user');

function getTokenForUser(user) {
  const payload = {
    sub: user.id,
    iat: new Date().getTime(),
  };

  return jwt.encode(payload, process.env.SECRET);
}


const signUp = (req, res, next) => {
  const { email, username, password } = req.body;

  return UserModel.findOne({ email }, (emailError, existingUser) => {
    if (emailError) return next(emailError);

    if (existingUser) {
      return res.status(422).send({ message: 'Email already exist' });
    }

    if (_.isEmpty(email) || _.isEmpty(username) || _.isEmpty(password)) {
      return res.status(422).send({ message: 'Email or Password empty' });
    }

    return UserModel.findOne({ username }, (usernameError, existingUsername) => {
      if (usernameError) return next(usernameError);

      if (existingUsername) {
        return res.status(422).send({ message: 'Username already taken' });
      }

      const user = new UserModel({ email, username, password });

      return user.save(saveUserError => {
        if (saveUserError) return next(saveUserError);

        return res.json({
          token: getTokenForUser(user),
          username: user.username,
        });
      });
    });
  });
};


const signIn = (req, res, next) => passport.authenticate('local', (err, user) => {
  if (err) return next(err);

  if (!user) {
    return res.status(500).send({ message: 'Wrong credentials' });
  }

  return res.json({
    token: getTokenForUser(user),
    username: user.username,
  });
})(req, res, next);

module.exports = {
  signUp,
  signIn,
};
