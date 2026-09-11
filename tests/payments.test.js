// Section 15-16: pending payments never self-confirm; only the boss's
// explicit confirm/reject action moves status, and remaining balance
// only counts confirmed payments.
jest.mock('../models/bossModel');
jest.mock('../services/profileService');

const bossModel = require('../models/bossModel');
const profileService = require('../services/profileService');
const bossService = require('../services/bossService');
const connectionService = require('../services/connectionService');

beforeEach(() => jest.clearAllMocks());

describe('connectionService.submitPayment', () => {
  test('a submitted payment is created as pending, never auto-confirmed', async () => {
    profileService.requireOwnedProfile.mockResolvedValue({ id: 'driverProfile1' });
    bossModel.findConnection.mockResolvedValue({ id: 'conn1', connected_profile_id: 'driverProfile1', status: 'active' });
    bossModel.createPaymentRequest.mockResolvedValue({ id: 'pay1', status: 'pending', amount: 15000 });

    const result = await connectionService.submitPayment('u1', 'driver', 'conn1', { amount: 15000 });

    expect(bossModel.createPaymentRequest).toHaveBeenCalledWith('conn1', expect.objectContaining({ amount: 15000 }));
    expect(result.status).toBe('pending');
  });

  test('rejects a zero/negative amount', async () => {
    profileService.requireOwnedProfile.mockResolvedValue({ id: 'driverProfile1' });
    await expect(connectionService.submitPayment('u1', 'driver', 'conn1', { amount: 0 }))
      .rejects.toMatchObject({ status: 400 });
  });

  test('rejects submitting to a connection that is not yours', async () => {
    profileService.requireOwnedProfile.mockResolvedValue({ id: 'driverProfile1' });
    bossModel.findConnection.mockResolvedValue({ id: 'conn1', connected_profile_id: 'someoneElse', status: 'active' });
    await expect(connectionService.submitPayment('u1', 'driver', 'conn1', { amount: 5000 }))
      .rejects.toMatchObject({ status: 404 });
  });
});

describe('bossService payment confirmation (Section 15)', () => {
  test('boss can confirm a pending payment on their own asset', async () => {
    profileService.requireOwnedProfile.mockResolvedValue({ id: 'bossProfile1' });
    bossModel.findPaymentRequest.mockResolvedValue({ id: 'pay1', status: 'pending', connection_id: 'conn1' });
    bossModel.findConnection.mockResolvedValue({ id: 'conn1', asset_id: 'asset1' });
    bossModel.findAssetById.mockResolvedValue({ id: 'asset1', boss_profile_id: 'bossProfile1' });
    bossModel.resolvePaymentRequest.mockResolvedValue({ id: 'pay1', status: 'confirmed' });

    const result = await bossService.confirmPayment('u1', 'pay1');
    expect(bossModel.resolvePaymentRequest).toHaveBeenCalledWith('pay1', 'confirmed');
    expect(result.status).toBe('confirmed');
  });

  test('cannot confirm a payment on someone else\'s asset', async () => {
    profileService.requireOwnedProfile.mockResolvedValue({ id: 'bossProfile1' });
    bossModel.findPaymentRequest.mockResolvedValue({ id: 'pay1', status: 'pending', connection_id: 'conn1' });
    bossModel.findConnection.mockResolvedValue({ id: 'conn1', asset_id: 'asset1' });
    bossModel.findAssetById.mockResolvedValue({ id: 'asset1', boss_profile_id: 'someOtherBoss' });

    await expect(bossService.confirmPayment('u1', 'pay1')).rejects.toMatchObject({ status: 403 });
  });

  test('cannot resolve a payment twice', async () => {
    profileService.requireOwnedProfile.mockResolvedValue({ id: 'bossProfile1' });
    bossModel.findPaymentRequest.mockResolvedValue({ id: 'pay1', status: 'confirmed', connection_id: 'conn1' });

    await expect(bossService.confirmPayment('u1', 'pay1')).rejects.toMatchObject({ status: 400 });
  });
});
