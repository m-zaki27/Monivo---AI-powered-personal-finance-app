import type { Budget } from '@/schemas/models';

export const mockBudget: Budget = {
  monthlyLimit: 3_400_00,
  alertThreshold: 0.8,
  emailAlerts: true,
};
