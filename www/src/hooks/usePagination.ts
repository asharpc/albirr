import { useState, useCallback } from 'react';
import { PaginationParams } from '@/types';

interface UsePaginationProps {
  initialPage?: number;
  initialPageSize?: number;
  initialSearch?: string;
  initialOrdering?: string;
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 20,
  initialSearch = '',
  initialOrdering = '',
}: UsePaginationProps = {}) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState(initialSearch);
  const [ordering, setOrdering] = useState(initialOrdering);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1); // Reset to first page when searching
  }, []);

  const handleOrderingChange = useCallback((newOrdering: string) => {
    setOrdering(newOrdering);
    setPage(1); // Reset to first page when changing sort
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
    setSearch(initialSearch);
    setOrdering(initialOrdering);
  }, [initialPage, initialPageSize, initialSearch, initialOrdering]);

  const getParams = useCallback((): PaginationParams => ({
    page,
    page_size: pageSize,
    search: search || undefined,
    ordering: ordering || undefined,
  }), [page, pageSize, search, ordering]);

  return {
    page,
    pageSize,
    search,
    ordering,
    handlePageChange,
    handlePageSizeChange,
    handleSearchChange,
    handleOrderingChange,
    reset,
    getParams,
  };
}