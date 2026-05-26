describe('Push service', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('when VAPID keys are set', () => {
    let pushService, webpush;

    beforeEach(() => {
      process.env.VAPID_PUBLIC_KEY = 'test-public-key';
      process.env.VAPID_PRIVATE_KEY = 'test-private-key';
      process.env.VAPID_SUBJECT = 'mailto:test@example.com';
      jest.mock('web-push');
      webpush = require('web-push');
      pushService = require('../services/push');
    });

    afterEach(() => {
      delete process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;
      delete process.env.VAPID_SUBJECT;
    });

    it('should enable push', () => {
      expect(pushService.pushEnabled).toBe(true);
    });

    it('should configure VAPID details', () => {
      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:test@example.com', 'test-public-key', 'test-private-key'
      );
    });

    it('should send notification', async () => {
      const subscription = { endpoint: 'https://push.example.com', keys: {} };
      const payload = { title: 'New message' };
      webpush.sendNotification.mockResolvedValue({ statusCode: 201 });

      const result = await pushService.sendPush(subscription, payload);
      expect(webpush.sendNotification).toHaveBeenCalledWith(subscription, JSON.stringify(payload));
      expect(result).toEqual({ statusCode: 201 });
    });
  });

  describe('when VAPID keys are missing', () => {
    let pushService;

    beforeEach(() => {
      delete process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;
      jest.mock('web-push');
      pushService = require('../services/push');
    });

    it('should disable push', () => {
      expect(pushService.pushEnabled).toBe(false);
    });

    it('should not send notification', async () => {
      const webpush = require('web-push');
      const result = await pushService.sendPush({}, { title: 'test' });
      expect(result).toBeNull();
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });
  });
});
