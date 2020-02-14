const assert = require('assert');
const { ObjectId } = require('mongodb');
const express = require('express');
const passport = require('passport');

const requireToken = passport.authenticate('jwt', { session: false });
const mongodb = require('../drivers/mongodb');

const router = express.Router();

async function isPostOwner(postId, reqUserId) {
  const { userId } = await mongodb.db.collection('posts').findOne({
    _id: new ObjectId(postId),
  });

  return String(userId) === String(reqUserId);
}

async function hydratePost(post) {
  const {
    username,
    profileImage,
  } = await mongodb.db.collection('users').findOne({ _id: new ObjectId(post.userId) });

  post.user = { username, profileImage };
  post.postId = post._id;
  delete post._id;

  return post;
}

router.get('/', async (req, res, next) => {
  try {
    await mongodb.init();

    const query = JSON.parse(req.query.query);

    if (query.userId) {
      query.userId = new ObjectId(query.userId);
    }

    const options = JSON.parse(req.query.options);

    const posts = await mongodb.db.collection('posts').find(query, options).sort({ createdAt: -1 }).toArray();

    const result = await Promise.all(posts.map(async post => hydratePost(post)));

    return res.json(result);
  } catch (err) {
    return next(err);
  }
});


router.get('/:postId', async (req, res, next) => {
  try {
    await mongodb.init();

    const { postId } = req.params;

    if (!ObjectId.isValid(postId)) return res.status(400).send({ message: 'Bad Request' });

    const post = await mongodb.db.collection('posts').findOne({
      _id: new ObjectId(postId),
    });

    if (!post) return res.status(404).send({ message: 'Post not found' });

    const result = await hydratePost(post);

    return res.json(result);
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
      title,
      description,
      location,
      coverImage: image.path,
      coverId: imageId,
      commentCount: 0,
      comments: [],
      likeCount: 0,
      likes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { insertedCount, insertedId } = await mongodb.db.collection('posts').insertOne(post);
    assert.equal(1, insertedCount);

    await mongodb.db.collection('users').updateOne(
      { _id: new ObjectId(post.userId) },
      { $inc: { postsCount: 1 } },
    );

    const createdPost = await mongodb.db.collection('posts').findOne({ _id: insertedId });
    const result = await hydratePost(createdPost);

    return res.json({ createdPost: result });
  } catch (err) {
    return next(err);
  }
});


router.put('/:postId', requireToken, async (req, res, next) => {
  try {
    await mongodb.init();

    const { postId } = req.params;

    if (!ObjectId.isValid(postId)) return res.status(400).send({ message: 'Bad Request' });

    const postOwner = await isPostOwner(postId, req.user._id);

    if (!postOwner) return res.status(404).send({ message: 'Trying to update the post of someone else' });

    const {
      title,
      description,
      location,
      imageId,
    } = req.body;

    const image = await mongodb.db.collection('images').findOne({
      _id: new ObjectId(imageId),
    });

    if (!image) return res.status(404).send({ message: 'Cover image not found' });

    const query = { _id: new ObjectId(postId) };
    const post = {
      title,
      description,
      location,
      coverImage: image.path,
      coverId: imageId,
      updatedAt: new Date(),
    };

    const { matchedCount, modifiedCount } = await mongodb.db.collection('posts').updateOne(
      query,
      { $set: post },
    );

    assert.equal(1, matchedCount);
    assert.equal(1, modifiedCount);

    const updatedPost = await mongodb.db.collection('posts').findOne(query);
    const result = await hydratePost(updatedPost);

    return res.json({ updatedPost: result });
  } catch (err) {
    return next(err);
  }
});


router.delete('/:postId', requireToken, async (req, res, next) => {
  try {
    await mongodb.init();

    const { postId } = req.params;
    const userId = new ObjectId(req.user._id);
    const postOwner = await isPostOwner(postId, userId);

    if (!postOwner) return res.status(404).send({ message: 'Trying to update the post of someone else' });

    if (!ObjectId.isValid(postId)) return res.status(400).send({ message: 'Bad Request' });

    const result = await mongodb.db.collection('posts').deleteOne({
      _id: new ObjectId(postId),
    });

    assert.equal(1, result.deletedCount);

    await mongodb.db.collection('users').updateOne(
      { _id: userId },
      { $inc: { postsCount: -1 } },
    );

    return res.json({ deletedPostId: postId });
  } catch (err) {
    return next(err);
  }
});


router.post('/comment/:postId', requireToken, async (req, res, next) => {
  try {
    await mongodb.init();

    const {
      params: { postId },
      user: { _id },
      body: { message },
    } = req;

    const { username } = await mongodb.db.collection('users').findOne({
      _id: new ObjectId(_id),
    });

    const comment = {
      userId: _id,
      username,
      message,
      createdAt: new Date(),
    };

    const { result: { nModified } } = await mongodb.db.collection('posts').update(
      { _id: new ObjectId(postId) },
      {
        $inc: { commentCount: 1 },
        $push: { comments: comment },
      },
    );

    assert.equal(1, nModified);

    const post = await mongodb.db.collection('posts').findOne({
      _id: new ObjectId(postId),
    });

    const result = await hydratePost(post);

    return res.json({ updatedPost: result });
  } catch (err) {
    return next(err);
  }
});

async function likeOrDislikePost(username, _id) {
  try {
    const result = await mongodb.db.collection('posts').updateOne(
      {
        _id,
        likes: { $ne: username },
      },
      {
        $inc: { likeCount: 1 },
        $push: { likes: username },
      },
    );

    if (result.modifiedCount === 0) {
      await mongodb.db.collection('posts').updateOne(
        {
          _id,
          likes: username,
        },
        {
          $inc: { likeCount: -1 },
          $pull: { likes: username },
        },
      );
    }

    return true;
  } catch (e) {
    throw new Error(e);
  }
}

router.put('/like/:postId', requireToken, async (req, res, next) => {
  try {
    await mongodb.init();

    const {
      params: { postId },
      user: { username },
    } = req;
    const _id = new ObjectId(postId);

    await likeOrDislikePost(username, _id);

    const post = await mongodb.db.collection('posts').findOne({ _id });
    const result = await hydratePost(post);

    return res.json({ likedPost: result });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
