import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { queryKeys } from '@/lib/queryClient';
import {
  addDupe,
  computeCollectionStats,
  fetchCollectionItems,
  fetchSeriesCompletion,
  fetchUserFigures,
  filterDupes,
  filterOwned,
  filterWishlist,
  groupCollectionBySeries,
  markOwned,
  markWishlist,
  type CollectionItem,
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

export function useCollectionItems() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.collection(userId ?? ''),
    queryFn: () => fetchCollectionItems(userId!),
    enabled: Boolean(userId),
  });
}

export function useCollectionSegments() {
  const query = useCollectionItems();
  const items = query.data ?? [];
  const owned = filterOwned(items);
  const wishlist = filterWishlist(items);
  const dupes = filterDupes(items);

  return {
    ...query,
    owned,
    wishlist,
    dupes,
    ownedGroups: groupCollectionBySeries(owned),
    wishlistGroups: groupCollectionBySeries(wishlist),
    dupeGroups: groupCollectionBySeries(dupes),
    stats: computeCollectionStats(items),
  };
}

/** @deprecated use useCollectionSegments */
export function useOwnedCollection() {
  const segments = useCollectionSegments();
  return {
    ...segments,
    data: segments.data
      ? { items: segments.owned, groups: segments.ownedGroups }
      : undefined,
  };
}

export function useSeriesCompletion() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.seriesCompletion(userId ?? ''),
    queryFn: fetchSeriesCompletion,
    enabled: Boolean(userId),
  });
}

function patchUserFigures(
  rows: UserFigure[] | undefined,
  next: UserFigure,
): UserFigure[] {
  const list = rows ?? [];
  const idx = list.findIndex((row) => row.figure_id === next.figure_id);
  if (idx === -1) return [next, ...list];
  const copy = [...list];
  copy[idx] = next;
  return copy;
}

function patchCollectionItems(
  rows: CollectionItem[] | undefined,
  next: UserFigure,
): CollectionItem[] {
  const list = rows ?? [];
  const idx = list.findIndex((row) => row.figure_id === next.figure_id);
  if (idx === -1) {
    return [
      {
        ...next,
        figures: null,
      },
      ...list,
    ];
  }
  const copy = [...list];
  copy[idx] = { ...copy[idx], ...next };
  return copy;
}

type MutationContext = {
  previousUserFigures?: UserFigure[];
  previousCollection?: CollectionItem[];
};

function applyOptimistic(
  queryClient: QueryClient,
  userId: string,
  next: UserFigure,
): MutationContext {
  const ufKey = queryKeys.userFigures(userId);
  const colKey = queryKeys.collection(userId);

  const previousUserFigures = queryClient.getQueryData<UserFigure[]>(ufKey);
  const previousCollection =
    queryClient.getQueryData<CollectionItem[]>(colKey);

  queryClient.setQueryData(ufKey, patchUserFigures(previousUserFigures, next));
  queryClient.setQueryData(
    colKey,
    patchCollectionItems(previousCollection, next),
  );

  return { previousUserFigures, previousCollection };
}

function restoreOptimistic(
  queryClient: QueryClient,
  userId: string,
  context?: MutationContext,
) {
  if (!context) return;
  if (context.previousUserFigures) {
    queryClient.setQueryData(
      queryKeys.userFigures(userId),
      context.previousUserFigures,
    );
  }
  if (context.previousCollection) {
    queryClient.setQueryData(
      queryKeys.collection(userId),
      context.previousCollection,
    );
  }
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.seriesCompletion(user.id),
      }),
    ]);
  };
}

export function useMarkOwned() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateUserFigureQueries();

  return useMutation({
    mutationFn: (figureId: string) => markOwned(user!.id, figureId),
    onMutate: async (figureId) => {
      if (!user) return;
      await queryClient.cancelQueries({
        queryKey: queryKeys.userFigures(user.id),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.collection(user.id),
      });

      const existing = queryClient
        .getQueryData<UserFigure[]>(queryKeys.userFigures(user.id))
        ?.find((row) => row.figure_id === figureId);

      const next: UserFigure = {
        user_id: user.id,
        figure_id: figureId,
        status: 'owned',
        quantity:
          existing?.status === 'owned' && existing.quantity > 0
            ? existing.quantity
            : 1,
        added_at: existing?.added_at ?? new Date().toISOString(),
      };

      return applyOptimistic(queryClient, user.id, next);
    },
    onError: (_err, _vars, context) => {
      if (user) restoreOptimistic(queryClient, user.id, context);
    },
    onSuccess: (serverRow) => {
      if (!user) return;
      applyOptimistic(queryClient, user.id, serverRow);
    },
    onSettled: invalidate,
  });
}

export function useMarkWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateUserFigureQueries();

  return useMutation({
    mutationFn: (figureId: string) => markWishlist(user!.id, figureId),
    onMutate: async (figureId) => {
      if (!user) return;
      await queryClient.cancelQueries({
        queryKey: queryKeys.userFigures(user.id),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.collection(user.id),
      });

      const existing = queryClient
        .getQueryData<UserFigure[]>(queryKeys.userFigures(user.id))
        ?.find((row) => row.figure_id === figureId);

      const next: UserFigure = {
        user_id: user.id,
        figure_id: figureId,
        status: 'wishlist',
        quantity: 0,
        added_at: existing?.added_at ?? new Date().toISOString(),
      };

      return applyOptimistic(queryClient, user.id, next);
    },
    onError: (_err, _vars, context) => {
      if (user) restoreOptimistic(queryClient, user.id, context);
    },
    onSuccess: (serverRow) => {
      if (!user) return;
      applyOptimistic(queryClient, user.id, serverRow);
    },
    onSettled: invalidate,
  });
}

export function useAddDupe() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateUserFigureQueries();

  return useMutation({
    mutationFn: (figureId: string) => addDupe(user!.id, figureId),
    onMutate: async (figureId) => {
      if (!user) return;
      await queryClient.cancelQueries({
        queryKey: queryKeys.userFigures(user.id),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.collection(user.id),
      });

      const existing = queryClient
        .getQueryData<UserFigure[]>(queryKeys.userFigures(user.id))
        ?.find((row) => row.figure_id === figureId);

      const base =
        existing?.status === 'owned' && existing.quantity > 0
          ? existing.quantity
          : 1;

      const next: UserFigure = {
        user_id: user.id,
        figure_id: figureId,
        status: 'owned',
        quantity: base + 1,
        added_at: existing?.added_at ?? new Date().toISOString(),
      };

      return applyOptimistic(queryClient, user.id, next);
    },
    onError: (_err, _vars, context) => {
      if (user) restoreOptimistic(queryClient, user.id, context);
    },
    onSuccess: (serverRow) => {
      if (!user) return;
      applyOptimistic(queryClient, user.id, serverRow);
    },
    onSettled: invalidate,
  });
}

export function findUserFigure(
  rows: UserFigure[] | undefined,
  figureId: string,
): UserFigure | null {
  return rows?.find((row) => row.figure_id === figureId) ?? null;
}
