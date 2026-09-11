const mediaModel = require('../models/mediaModel');

async function uploadFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const record = await mediaModel.record(req.user.id, {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      purpose: req.body.purpose || 'general',
    });

    res.status(201).json({ file: record });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadFile };
