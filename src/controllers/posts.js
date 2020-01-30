const assert = require('assert');
const { ObjectId } = require('mongodb');
const mongodb = require('../drivers/mongodb');

const getPost = async (req, res, next) => {
  try {
    await mongodb.init();

    const { postId } = req.query;

    if (!postId) return res.status(500).send({ message: 'Internal server Error' });

    const post = await mongodb.db.collection('posts').findOne({
      _id: new ObjectId(postId),
    });

    if (!post) return res.status(404).send({ message: 'Post not found' });

    return res.json(post);
  } catch (err) {
    return next(err);
  }
};

const createPost = async (req, res, next) => {
  try {
    await mongodb.init();

    const userId = req.user._id;
    const {
      username,
      title,
      description,
      location,
      coverImage,
    } = req.body;

    if (!userId) return res.status(500).send({ message: 'Internal server Error' });

    const user = await mongodb.db.collection('users').findOne({
      _id: userId,
    });

    if (!user) return res.status(404).send({ message: `User ${username} not found` });

    const post = {
      userId: user._id,
      username: user.username,
      title,
      description,
      location,
      coverImage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await mongodb.db.collection('posts').insertOne(post);
    assert.equal(1, result.insertedCount);

    return res.json({ postId: result.insertedId });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createPost,
  getPost,
};
