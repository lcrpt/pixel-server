const passport = require('passport');
const { ExtractJwt } = require('passport-jwt');
const JwtStrategy = require('passport-jwt').Strategy;
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt-nodejs');
const mongodb = require('../drivers/mongodb');

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: process.env.SECRET,
};

const jwtCheckToken = new JwtStrategy(jwtOptions, async (payload, done) => {
  await mongodb.init();

  const userId = payload.sub;

  return mongodb.db.collection('users').findOne({ _id: userId }, (err, user) => {
    if (err) return done(err, false);
    if (user) return done(null, user);

    return done(null, false);
  });
});

const localOptions = { usernameField: 'email' };


function isPasswordEqualTo(externalPassword, userPassword, done) {
  return bcrypt.compare(externalPassword, userPassword, (err, isMatch) => {
    if (err) return done(err);
    return done(null, isMatch);
  });
}

const localLoginStrategy = new LocalStrategy(localOptions, async (
  email,
  externalPassword,
  done,
) => {
  await mongodb.init();

  return mongodb.db.collection('users').findOne({ email }, (err, user) => {
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
