import { useQueryClient } from '@tanstack/react-query';

import { useExportCsv } from '@/components/transactions/useExportCsv';
import { queryKeys } from '@/hooks';
import { transactionsApi } from '@/services';

/** Exports every transaction; fetchQuery reuses the cache when fresh. */
export function useExportAll(currency: string) {
  const qc = useQueryClient();
  const { exportCsv, exporting } = useExportCsv(currency);
  const exportAll = async () => {
    const all = await qc.fetchQuery({ queryKey: queryKeys.transactions.list({}), queryFn: () => transactionsApi.listTransactions({}) });
    await exportCsv(all);
  };
  return { exportAll, exporting };
}
