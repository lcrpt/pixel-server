const assert = require('assert');
const { ObjectId } = require('mongodb');
const express = require('express');
const passport = require('passport');

const requireToken = passport.authenticate('jwt', { session: false });
const mongodb = require('../drivers/mongodb');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    await mongodb.init();

    const { postId } = req.query;

    if (!postId) return res.status(500).send({ message: 'Internal server Error' });

    const post = await mongodb.db.collection('posts').findOne({
      _id: new ObjectId(postId),
    });

    if (!post) return res.status(404).send({ message: 'Post not found' });

    return res.json({
      postId: post._id,
      title: post.title,
      description: post.description,
      location: post.location,
      coverImage: post.coverImage,
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/', requireToken, async (req, res, next) => {
  try {
    await mongodb.init();

    const userId = req.user._id;
    const {
      title,
      description,
      location,
      imageId,
    } = req.body;

    if (!userId) return res.status(500).send({ message: 'Internal server Error' });

    const user = await mongodb.db.collection('users').findOne({
      _id: new ObjectId(userId),
    });

    if (!user) return res.status(404).send({ message: 'User not found' });

    const image = await mongodb.db.collection('images').findOne({
      _id: new ObjectId(imageId),
    });

    if (!image) return res.status(404).send({ message: 'Cover image not found' });

    const post = {
      userId: user._id,
      username: user.username,
      title,
      description,
      location,
      coverImage: image.path,
      coverId: imageId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await mongodb.db.collection('posts').insertOne(post);
    assert.equal(1, result.insertedCount);

    return res.json({ postId: result.insertedId });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
