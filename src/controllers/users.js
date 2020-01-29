const UserModel = require('../models/user');

const getUser = (req, res, next) => {
  const { username } = req.query;

  return UserModel.findOne({ username }, (err, user) => {
    if (err) return next(err);

    if (!user) {
      return res.status(404).send({ message: `User ${username} not found` });
    }

    return res.json({
      email: user.email,
      username: user.username,
    });
  });
};

module.exports = {
  getUser,
};
