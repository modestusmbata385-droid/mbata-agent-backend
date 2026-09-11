// Section 9's "does user have profile?" gate lives on the frontend;
// this service backs it with real create/list logic.
const profileModel = require('../models/profileModel');

const VALID_TYPES = ['finance', 'business', 'boss', 'driver', 'tenant', 'parent', 'student'];

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function createProfile(userId, profileType, profileData) {
  if (!VALID_TYPES.includes(profileType)) {
    throw httpError(400, `Unknown profile type: ${profileType}`);
  }
  const existing = await profileModel.findByUserAndType(userId, profileType);
  if (existing) throw httpError(409, `You already have a ${profileType} profile.`);

  return profileModel.create(userId, profileType, profileData || {});
}

async function listProfiles(userId) {
  return profileModel.listByUser(userId);
}

// Used by other module services to enforce ownership before acting on a profile.
async function requireOwnedProfile(userId, profileType) {
  const profile = await profileModel.findByUserAndType(userId, profileType);
  if (!profile) throw httpError(404, `No ${profileType} profile found. Create one first.`);
  return profile;
}

module.exports = { createProfile, listProfiles, requireOwnedProfile, VALID_TYPES };
