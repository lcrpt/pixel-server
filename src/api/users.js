const express = require('express');
const { ObjectId } = require('mongodb');
const passport = require('passport');
const assert = require('assert');
const mongodb = require('../drivers/mongodb');

const router = express.Router();
const requireToken = passport.authenticate('jwt', { session: false });

function hydrateUser(user) {
  user.userId = user._id;
  delete user._id;
  delete user.password;

  return user;
}

router.get('/', async (req, res, next) => {
  await mongodb.init();

  const { username } = req.query;

  try {
    const user = await mongodb.db.collection('users').findOne({ username });

    if (!user) {
      return res.status(404).send({ message: `User ${username} not found` });
    }

    return res.json(hydrateUser(user));
  } catch (err) {
    return next(err);
  }
});

router.put('/:userId', requireToken, async (req, res, next) => {
  await mongodb.init();

  const userQueryId = new ObjectId(req.params.userId);
  const {
    name,
    username,
    website,
    bio,
    phone,
    gender,
    imageId,
  } = req.body;

  try {
    const existingUsername = await mongodb.db.collection('users').find({
      $and: [
        { _id: { $ne: userQueryId } },
        { username },
      ],
    }).toArray();

    if (existingUsername.length) {
      return res.status(422).send({ message: 'Username already taken' });
    }

    const image = await mongodb.db.collection('images').findOne({
      _id: new ObjectId(imageId),
    });

    if (!image) return res.status(404).send({ message: 'Image not found' });

    const data = {
      name,
      username,
      website,
      bio,
      phone,
      gender,
      profileImage: image.path,
      profileImageId: imageId,
      updatedAt: new Date(),
    };

    const userIdQuery = { _id: userQueryId };

    const result = await mongodb.db.collection('users').updateOne(
      userIdQuery,
      { $set: data },
    );

    assert.equal(1, result.matchedCount);
    assert.equal(1, result.modifiedCount);

    const updatedUser = await mongodb.db.collection('users').findOne(userIdQuery);

    return res.json({ updatedUser: hydrateUser(updatedUser) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
