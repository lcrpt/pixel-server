require('../services/passport');
const assert = require('assert');
const express = require('express');
const passport = require('passport');
const mongodb = require('../drivers/mongodb');
const upload = require('../services/image');

const router = express.Router();
const requireToken = passport.authenticate('jwt', { session: false });

router.post('/', requireToken, upload.single('coverImage'), async (req, res, next) => {
  try {
    await mongodb.init();

    const url = `${req.protocol}://${req.get('host')}`;
    const path = `${url}/${req.file.filename}`;

    const image = {
      path,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await mongodb.db.collection('images').insertOne(image);
    assert.equal(1, result.insertedCount);

    return res.json({ imageId: result.insertedId });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
