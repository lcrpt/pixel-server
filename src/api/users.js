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


async function followOrUnfollowUser(currentUser, followingUser) {
  try {
    // current user follow or unfollow a user
    const result = await mongodb.db.collection('users').updateOne(
      {
        _id: currentUser._id,
        following: { $ne: followingUser.username },
      },
      {
        $inc: { followingCount: 1 },
        $push: { following: followingUser.username },
      },
    );

    if (result.modifiedCount === 0) {
      await mongodb.db.collection('users').updateOne(
        {
          _id: currentUser._id,
          following: followingUser.username,
        },
        {
          $inc: { followingCount: -1 },
          $pull: { following: followingUser.username },
        },
      );
    }

    return true;
  } catch (e) {
    throw new Error(e);
  }
}

async function userFollowers(currentUser, followingUser) {
  try {
    // user just been followed
    const result = await mongodb.db.collection('users').updateOne(
      {
        _id: followingUser._id,
        followers: { $ne: currentUser.username },
      },
      {
        $inc: { followersCount: 1 },
        $push: { followers: currentUser.username },
      },
    );

    if (result.modifiedCount === 0) {
      await mongodb.db.collection('users').updateOne(
        {
          _id: followingUser._id,
          followers: currentUser.username,
        },
        {
          $inc: { followersCount: -1 },
          $pull: { followers: currentUser.username },
        },
      );
    }

    return true;
  } catch (e) {
    throw new Error(e);
  }
}

router.put('/follow/:userId', requireToken, async (req, res, next) => {
  try {
    await mongodb.init();

    const {
      params: { userId },
      user: { username },
    } = req;

    if (!ObjectId.isValid(userId)) return res.status(400).send({ message: 'Bad Request' });

    const currentUser = await mongodb.db.collection('users').findOne({ username });
    const followingUser = await mongodb.db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (currentUser.username === followingUser.username) return res.status(400).send({ message: 'You can not follow yourself' });

    await followOrUnfollowUser(currentUser, followingUser);
    await userFollowers(currentUser, followingUser);

    const followedUser = await mongodb.db.collection('users').findOne({ _id: new ObjectId(userId) });

    return res.json({
      followedUser: hydrateUser(followedUser),
    });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
