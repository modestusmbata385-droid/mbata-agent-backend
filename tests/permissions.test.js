// Section 30: authorization chain. Verifies the middleware gate and the
// service-level ownership check independently of any real database.
jest.mock('../models/profileModel');
const profileModel = require('../models/profileModel');
const { requireProfile } = require('../middleware/permissionMiddleware');
const profileService = require('../services/profileService');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => jest.clearAllMocks());

describe('requireProfile middleware', () => {
  test('403/404s when the user has no profile of that type', async () => {
    profileModel.findByUserAndType.mockResolvedValue(null);
    const req = { user: { id: 'u1' } };
    const res = mockRes();
    const next = jest.fn();

    await requireProfile('boss')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  test('attaches activeProfile and calls next() when profile exists', async () => {
    const profile = { id: 'p1', profile_type: 'boss' };
    profileModel.findByUserAndType.mockResolvedValue(profile);
    const req = { user: { id: 'u1' } };
    const res = mockRes();
    const next = jest.fn();

    await requireProfile('boss')(req, res, next);

    expect(req.activeProfile).toBe(profile);
    expect(next).toHaveBeenCalled();
  });
});

describe('profileService.requireOwnedProfile', () => {
  test('throws 404 when caller does not own a profile of that type', async () => {
    profileModel.findByUserAndType.mockResolvedValue(null);
    await expect(profileService.requireOwnedProfile('u1', 'finance'))
      .rejects.toMatchObject({ status: 404 });
  });

  test('a driver cannot act as a boss: wrong-type lookup returns nothing', async () => {
    // Simulates a driver-profile user trying to hit a boss-only action —
    // findByUserAndType('u1','boss') finds nothing because they only have 'driver'.
    profileModel.findByUserAndType.mockImplementation((userId, type) =>
      type === 'driver' ? { id: 'p1', profile_type: 'driver' } : null
    );
    await expect(profileService.requireOwnedProfile('u1', 'boss'))
      .rejects.toMatchObject({ status: 404 });
    await expect(profileService.requireOwnedProfile('u1', 'driver')).resolves.toMatchObject({ profile_type: 'driver' });
  });
});

describe('profileService.createProfile', () => {
  test('rejects an unknown profile type', async () => {
    await expect(profileService.createProfile('u1', 'superadmin', {}))
      .rejects.toMatchObject({ status: 400 });
  });

  test('rejects creating a duplicate profile of the same type', async () => {
    profileModel.findByUserAndType.mockResolvedValue({ id: 'p1' });
    await expect(profileService.createProfile('u1', 'finance', {}))
      .rejects.toMatchObject({ status: 409 });
  });
});
