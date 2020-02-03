const multer = require('multer');
const uuidv4 = require('uuid/v4');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/');
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(' ').join('-');
    const uniqueFileName = `${uuidv4()}-${fileName}`;
    cb(null, uniqueFileName);
  },
});

const limits = {
  fileSize: 1000000 * 5,
};

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    return cb(null, true);
  }

  return cb(new Error('Only .png, .jpg and .jpeg format allowed!'), false);
};

const upload = multer({
  storage,
  limits,
  fileFilter,
});

module.exports = upload;
