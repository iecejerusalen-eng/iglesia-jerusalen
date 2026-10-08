import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';

export default function FinanceSessionPrivacy() {
  const client = useQueryClient();
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (
          state.user?.id === previous.user?.id &&
          state.roles === previous.roles &&
          state.permissions === previous.permissions
        )
          return;
        const filters = {
          predicate: (query: { queryKey: readonly unknown[] }) =>
            String(query.queryKey[0]).startsWith('finance-') ||
            query.queryKey[0] === 'my-contributions' ||
            query.queryKey[0] === 'analytics_dashboard_data' ||
            query.queryKey[0] === 'dashboard-stats',
        };
        void client
          .cancelQueries(filters)
          .then(() => client.removeQueries(filters));
      }),
    [client],
  );
  return null;
}
