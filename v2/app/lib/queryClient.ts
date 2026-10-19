import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const queryKeys = {
  userFigures: (userId: string) => ['userFigures', userId] as const,
  collection: (userId: string) => ['collection', userId] as const,
  seriesCompletion: (userId: string) => ['seriesCompletion', userId] as const,
  series: ['series'] as const,
  seriesDetail: (seriesId: string) => ['seriesDetail', seriesId] as const,
  figures: (seriesId: string | null, search: string) =>
    ['figures', seriesId, search] as const,
  figure: (id: string) => ['figure', id] as const,
};
