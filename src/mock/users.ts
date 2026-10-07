import type { User } from '@/schemas/models';

export const mockUser: User = {
  id: 'usr_001',
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'alex.morgan@example.com',
  currency: 'USD',
  mfaEnabled: false,
  notifications: { push: true, weeklyRecap: true },
};
