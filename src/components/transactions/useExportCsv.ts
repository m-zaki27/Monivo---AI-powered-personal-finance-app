import { useState } from 'react';

import { useToast } from '@/components/ui';
import { useAccountMap, useCategoryMap } from '@/hooks';
import { transactionsToCsv } from '@/lib/csv';
import { dayKey } from '@/lib/dates';
import { shareTextFile } from '@/lib/shareFile';
import type { Transaction } from '@/schemas/models';

export function useExportCsv(currency: string) {
  const toast = useToast();
  const categories = useCategoryMap();
  const accounts = useAccountMap();
  const [exporting, setExporting] = useState(false);

  const exportCsv = async (transactions: Transaction[]) => {
    if (transactions.length === 0) {
      toast.show({ message: 'Nothing to export with these filters', tone: 'warning' });
      return;
    }
    setExporting(true);
    try {
      const csv = transactionsToCsv(transactions, categories, accounts, currency);
      await shareTextFile(`monivo-transactions-${dayKey(new Date())}.csv`, csv, 'text/csv', 'public.comma-separated-values-text');
      const n = transactions.length;
      toast.show({ message: `Exported ${n} ${n === 1 ? 'transaction' : 'transactions'}`, tone: 'success' });
    } catch (e) {
      toast.show({ message: e instanceof Error ? e.message : "Couldn't export. Please try again.", tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return { exportCsv, exporting };
}
