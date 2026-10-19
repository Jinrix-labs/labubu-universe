import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { queryKeys } from '@/lib/queryClient';
import {
  addDupe,
  fetchOwnedCollection,
  fetchUserFigures,
  groupCollectionBySeries,
  markOwned,
  markWishlist,
  type UserFigure,
} from '@/lib/queries';

export function useUserFigures() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.userFigures(userId ?? ''),
    queryFn: () => fetchUserFigures(userId!),
    enabled: Boolean(userId),
  });
}

export function useOwnedIds() {
  const query = useUserFigures();
  const ownedIds = new Set(
    (query.data ?? [])
      .filter((row) => row.status === 'owned')
      .map((row) => row.figure_id),
  );
  return { ...query, ownedIds };
}

export function useOwnedCollection() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.collection(userId ?? ''),
    queryFn: async () => {
      const items = await fetchOwnedCollection(userId!);
      const groups = groupCollectionBySeries(items);
      if (__DEV__) {
        console.log('[useOwnedCollection] grouped', {
          rawCount: items.length,
          groupCount: groups.length,
          groups: groups.map((g) => ({
            seriesName: g.seriesName,
            count: g.items.length,
          })),
        });
      }
      return { items, groups };
    },
    enabled: Boolean(userId),
  });
}

function useInvalidateUserFigureQueries() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return async () => {
    if (!user) return;
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.userFigures(user.id),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.collection(user.id),
      }),
    ]);
  };
}

export function useMarkOwned() {
  const { user } = useAuth();
  const invalidate = useInvalidateUserFigureQueries();

  return useMutation({
    mutationFn: (figureId: string) => markOwned(user!.id, figureId),
    onSuccess: invalidate,
  });
}

export function useMarkWishlist() {
  const { user } = useAuth();
  const invalidate = useInvalidateUserFigureQueries();

  return useMutation({
    mutationFn: (figureId: string) => markWishlist(user!.id, figureId),
    onSuccess: invalidate,
  });
}

export function useAddDupe() {
  const { user } = useAuth();
  const invalidate = useInvalidateUserFigureQueries();

  return useMutation({
    mutationFn: (figureId: string) => addDupe(user!.id, figureId),
    onSuccess: invalidate,
  });
}

export function findUserFigure(
  rows: UserFigure[] | undefined,
  figureId: string,
): UserFigure | null {
  return rows?.find((row) => row.figure_id === figureId) ?? null;
}
