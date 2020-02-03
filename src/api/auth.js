const _ = require('lodash');
const jwt = require('jwt-simple');
const passport = require('passport');
const bcrypt = require('bcrypt-nodejs');
const express = require('express');
const mongodb = require('../drivers/mongodb');

const router = express.Router();

function getTokenForUser(user) {
  const payload = {
    sub: user._id,
    iat: new Date().getTime(),
  };

  return jwt.encode(payload, process.env.SECRET);
}

router.post('/signUp', async (req, res, next) => {
  await mongodb.init();

  const { email, username, password } = req.body;

  try {
    const existingUser = await mongodb.db.collection('users').findOne({ email });

    if (existingUser) {
      return res.status(422).send({ message: 'Email already exist' });
    }

    if (_.isEmpty(email) || _.isEmpty(username) || _.isEmpty(password)) {
      return res.status(422).send({ message: 'Email or Password empty' });
    }

    const existingUsername = await mongodb.db.collection('users').findOne({ username });

    if (existingUsername) {
      return res.status(422).send({ message: 'Username already taken' });
    }

    return bcrypt.genSalt(10, (err, salt) => {
      if (err) return next(err);

      return bcrypt.hash(password, salt, null, async (error, hash) => {
        if (error) return next(error);

        const { insertedId } = await mongodb.db.collection('users').insertOne({
          email,
          username,
          password: hash,
        });

        const user = await mongodb.db.collection('users').findOne({ _id: insertedId });

        return res.json({
          token: getTokenForUser(user),
          username: user.username,
        });
      });
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/signIn', (req, res, next) => passport.authenticate('local', (err, user) => {
  if (err) return next(err);

  if (!user) {
    return res.status(500).send({ message: 'Wrong credentials' });
  }

  return res.json({
    token: getTokenForUser(user),
    username: user.username,
  });
})(req, res, next));

module.exports = router;
