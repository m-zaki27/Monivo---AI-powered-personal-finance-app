import { useQueryClient } from '@tanstack/react-query';

import { useExportCsv } from '@/components/transactions/useExportCsv';
import { queryKeys } from '@/hooks';
import { transactionsApi } from '@/services';

/**
 * "Export data" in Settings: every transaction, unfiltered. fetchQuery reuses
 * the cached list if it's fresh, otherwise asks the server.
 */
export function useExportAll(currency: string) {
  const qc = useQueryClient();
  const { exportCsv, exporting } = useExportCsv(currency);
  const exportAll = async () => {
    const all = await qc.fetchQuery({ queryKey: queryKeys.transactions.list({}), queryFn: () => transactionsApi.listTransactions({}) });
    await exportCsv(all);
  };
  return { exportAll, exporting };
}
