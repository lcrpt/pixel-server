require('./services/passport');

const authRoutes = require('./api/auth');
const userRoutes = require('./api/users');
const postRoutes = require('./api/posts');
const imageRoute = require('./api/images');

module.exports = app => {
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/posts', postRoutes);
  app.use('/images', imageRoute);
};
