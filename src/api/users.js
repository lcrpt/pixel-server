const express = require('express');
const mongodb = require('../drivers/mongodb');

const router = express.Router();

router.get('/', async (req, res, next) => {
  await mongodb.init();

  const { username } = req.query;

  try {
    const user = await mongodb.db.collection('users').findOne({ username });

    if (!user) {
      return res.status(404).send({ message: `User ${username} not found` });
    }

    return res.json({
      email: user.email,
      username: user.username,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
