const passport = require('passport');
const { ExtractJwt } = require('passport-jwt');
const JwtStrategy = require('passport-jwt').Strategy;
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt-nodejs');
const { ObjectId } = require('mongodb');

const mongodb = require('../drivers/mongodb');

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: process.env.SECRET,
};

const jwtCheckToken = new JwtStrategy(jwtOptions, async (payload, done) => {
  await mongodb.init();

  const userId = new ObjectId(payload.sub);

  return mongodb.db.collection('users').findOne({ _id: userId }, (err, user) => {
    if (err) return done(err, false);
    if (user) return done(null, user);

    return done(null, false);
  });
});


function isPasswordEqualTo(externalPassword, userPassword, done) {
  return bcrypt.compare(externalPassword, userPassword, (err, isMatch) => {
    if (err) return done(err);
    return done(null, isMatch);
  });
}

const localOptions = { usernameField: 'signInId' };

const localLoginStrategy = new LocalStrategy(localOptions, async (
  signInId,
  externalPassword,
  done,
) => {
  await mongodb.init();

  const query = {
    $or: [
      { email: signInId },
      { username: signInId },
    ],
  };

  return mongodb.db.collection('users').findOne(query, (err, user) => {
    if (err) return done(err);
    if (!user || !user.username) return done(null, false);

    return isPasswordEqualTo(externalPassword, user.password, (error, isMatch) => {
      if (error) return done(error);
      if (!isMatch) return done(null, false);

      return done(null, user);
    });
  });
});

passport.use(jwtCheckToken);
passport.use(localLoginStrategy);
