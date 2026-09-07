// Section 26: camera/media upload. Local disk storage for this skeleton;
// swap the multer storage engine for S3/GCS in production.
const multer = require('multer');
const path = require('path');
const env = require('../config/env');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploads.dir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage,
  limits: { fileSize: env.uploads.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, or WEBP images are allowed.'));
    }
    cb(null, true);
  },
});

module.exports = { upload };

