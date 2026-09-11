const userModel = require('../models/userModel');

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phoneNumber: user.phone_number,
      emailVerified: Boolean(user.email_verified_at),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { me };
