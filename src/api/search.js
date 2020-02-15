const express = require('express');
const mongodb = require('../drivers/mongodb');

const router = express.Router();

async function searchUsers(searchQuery) {
  const users = await mongodb.db.collection('users')
    .find(
      { $text: { $search: searchQuery } },
      { score: { $meta: 'textScore' } },
    )
    .project({
      score: { $meta: 'textScore' },
      username: 1,
      name: 1,
      profileImage: 1,
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .toArray();

  return users.map(user => { user.type = 'user'; return user; });
}

async function searchPosts(searchQuery) {
  const posts = await mongodb.db.collection('posts')
    .find(
      { $text: { $search: searchQuery } },
      { score: { $meta: 'textScore' } },
    )
    .project({
      score: { $meta: 'textScore' },
      title: 1,
      location: 1,
      coverImage: 1,
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .toArray();

  return posts.map(post => { post.type = 'post'; return post; });
}

router.post('/', async (req, res, next) => {
  try {
    await mongodb.init();
    const { searchQuery } = req.body;

    const users = await searchUsers(searchQuery);
    const posts = await searchPosts(searchQuery);

    const result = users.concat(posts);

    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
