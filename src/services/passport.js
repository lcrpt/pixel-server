const passport = require('passport');
const { ExtractJwt } = require('passport-jwt');
const JwtStrategy = require('passport-jwt').Strategy;
const LocalStrategy = require('passport-local');

const User = require('../models/user');

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: process.env.SECRET,
};

const jwtCheckToken = new JwtStrategy(jwtOptions, (payload, done) => {
  const userId = payload.sub;

  return User.findById(userId, (err, user) => {
    if (err) return done(err, false);
    if (user) return done(null, user);

    return done(null, false);
  });
});

const localOptions = { usernameField: 'email' };

const localLoginStrategy = new LocalStrategy(localOptions, (email, password, done) => {
  User.findOne({ email }, (err, user) => {
    if (err) return done(err);
    if (!user || !user.username) return done(null, false);

    return user.isPasswordEqualTo(password, (error, isMatch) => {
      if (error) return done(error);
      if (!isMatch) return done(null, false);

      return done(null, user);
    });
  });
});

passport.use(jwtCheckToken);
passport.use(localLoginStrategy);
