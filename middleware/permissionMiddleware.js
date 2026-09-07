// Section 30 chain: Authenticate -> Get Active Profile -> Check Role ->
// Check Permission -> Check Ownership. Route-level ownership checks live
// in each module's service (e.g. requireOwnedProfile); this middleware
// covers the "does an active profile of this type exist" gate so routes
// can fail fast before hitting a service at all.
const profileModel = require('../models/profileModel');

function requireProfile(profileType) {
  return async function requireProfileMiddleware(req, res, next) {
    try {
      const profile = await profileModel.findByUserAndType(req.user.id, profileType);
      if (!profile) {
        return res.status(404).json({ error: `No ${profileType} profile found. Create one first.` });
      }
      req.activeProfile = profile;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Placeholder for role/action-level checks once roles are more granular
// than "owns this profile type" (e.g. a business with staff accounts).
function requirePermission(action) {
  return function requirePermissionMiddleware(req, res, next) {
    next();
  };
}

module.exports = { requireProfile, requirePermission };

