const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const { Schema } = mongoose;

const userSchema = new Schema({
  email: { type: String, unique: true, lowercase: true },
  username: { type: String, unique: true },
  password: String,
});

userSchema.pre('save', function (next) {
  return bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);

    return bcrypt.hash(this.password, salt, null, (error, hash) => {
      if (err) return next(err);

      this.password = hash;

      return next();
    });
  });
});

userSchema.methods.isPasswordEqualTo = function (externalPassword, done) {
  bcrypt.compare(externalPassword, this.password, (err, isMatch) => {
    if (err) return done(err);
    return done(null, isMatch);
  });
};

const UserModel = mongoose.model('user', userSchema);

module.exports = UserModel;
