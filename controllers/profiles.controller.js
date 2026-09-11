const profileService = require('../services/profileService');

async function create(req, res, next) {
  try {
    const { profileType, profileData } = req.body;
    const profile = await profileService.createProfile(req.user.id, profileType, profileData);
    res.status(201).json({ profile });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const profiles = await profileService.listProfiles(req.user.id);
    res.json({ profiles });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list };
