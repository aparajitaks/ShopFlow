import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTrustScoreLatest,
  getTrustScoreHistory,
  postTrustScore,
} from '../api/trustScore.api';

// ── Query keys ─────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  latest: (customerId) => ['trustScore', 'latest', customerId],
  history: (customerId) => ['trustScore', 'history', customerId],
};

/**
 * Fetch the most recent trust score for a customer.
 * Returns null (not an error) when the customer has no score yet.
 */
export function useLatestScore(customerId) {
  return useQuery({
    queryKey: QUERY_KEYS.latest(customerId),
    queryFn: () => getTrustScoreLatest(customerId),
    enabled: Boolean(customerId?.trim()),
    staleTime: 30_000,
    retry: (failureCount, error) => {
      // Don't retry 404s — they're expected for new customers
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Fetch all past trust score calculations for a customer.
 */
export function useScoreHistory(customerId) {
  return useQuery({
    queryKey: QUERY_KEYS.history(customerId),
    queryFn: () => getTrustScoreHistory(customerId),
    enabled: Boolean(customerId?.trim()),
    staleTime: 30_000,
  });
}

/**
 * Mutation: POST a new set of order metrics to compute (and persist) a trust score.
 * On success, invalidates the latest and history queries for the affected customer
 * so the UI automatically refreshes.
 */
export function useSubmitScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postTrustScore,
    onSuccess: (data) => {
      const customerId = data.customer_id;
      // Invalidate both caches so Profile page re-fetches fresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.latest(customerId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history(customerId) });
      // Optimistically update the latest cache with the new result
      queryClient.setQueryData(QUERY_KEYS.latest(customerId), data);
    },
  });
}
