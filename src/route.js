require('./services/passport');

const authRoutes = require('./api/auth');
const userRoutes = require('./api/users');
const postRoutes = require('./api/posts');
const imageRoute = require('./api/images');
const searchRoute = require('./api/search');

module.exports = app => {
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/posts', postRoutes);
  app.use('/images', imageRoute);
  app.use('/search', searchRoute);

  app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
  });

  app.use((error, req, res) => {
    res.status(error.status || 500);
    res.json({
      error: {
        message: error.message,
      },
    });
  });
};
