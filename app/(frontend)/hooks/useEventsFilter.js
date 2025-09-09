// hooks/useEventsFilter.js
import { useState, useCallback, useEffect, useRef } from 'react';

const useEventsFilter = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 20
    });

    const [filters, setFiltersState] = useState({
        category: 'anything',
        tags: [],
        timeFilter: 'anytime',
        startDate: '',
        endDate: '',
        location: '',
        search: ''
    });

    const filtersRef = useRef(filters);
    const abortControllerRef = useRef(null);
    const currentRequestIdRef = useRef(0);

    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    const buildQueryParams = useCallback((filterData = filtersRef.current, page = 1, limit = 20) => {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('limit', String(limit));

        if (filterData.category && filterData.category !== 'anything') {
            params.append('category', filterData.category);
        }
        if (filterData.tags && filterData.tags.length > 0) {
            params.append('tags', JSON.stringify(filterData.tags));
        }
        if (filterData.timeFilter && filterData.timeFilter !== 'anytime') {
            params.append('timeFilter', filterData.timeFilter);
        }
        if (filterData.startDate) params.append('startDate', filterData.startDate);
        if (filterData.endDate) params.append('endDate', filterData.endDate);
        if (filterData.location) params.append('location', filterData.location);
        if (filterData.search) params.append('search', filterData.search);

        return params.toString();
    }, []);

    const fetchEvents = useCallback(async (filterData = null, page = 1, limit = 20) => {
        const requestId = ++currentRequestIdRef.current;
        const usedFilters = filterData || filtersRef.current;

        if (abortControllerRef.current) {
            try { abortControllerRef.current.abort(); } catch (_) { }
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            
            const qs = buildQueryParams(usedFilters, page, limit);
            const res = await fetch(`/api/filter?${qs}`, { signal: controller.signal });
            console.log(res);
            
            let json = null;
            try { json = await res.json(); } catch (e) { /* ignore parse */ }

            if (requestId !== currentRequestIdRef.current) return;

            if (!res.ok) {
                const message = json?.message || json?.error || `HTTP ${res.status}`;
                setError(message);
                setEvents([]);
                setPagination(prev => ({ ...prev, currentPage: page }));
                return;
            }

            if (!json || !json.success) {
                setError(json?.message || 'Failed to fetch');
                setEvents([]);
                return;
            }

            const data = json.data || {};
            setEvents(data.events || []);
            setPagination({
                currentPage: data.pagination?.currentPage || page,
                totalPages: data.pagination?.totalPages || 1,
                totalCount: data.pagination?.totalCount || (data.events ? data.events.length : 0),
                hasNextPage: data.pagination?.hasNextPage ?? false,
                hasPrevPage: data.pagination?.hasPrevPage ?? false,
                limit: data.pagination?.limit || limit
            });
        } catch (err) {
            if (err.name === 'AbortError') {
            } else {
                console.error('fetchEvents error:', err);
                setError(err.message || 'Network error');
                setEvents([]);
            }
        } finally {
            if (requestId === currentRequestIdRef.current) {
                setLoading(false);
            }
        }
    }, [buildQueryParams]);

    useEffect(() => {
        fetchEvents();
        return () => {
            if (abortControllerRef.current) {
                try { abortControllerRef.current.abort(); } catch (_) { }
            }
        };
    }, []);

    const handleFilterChange = useCallback((key, value) => {
        setFiltersState(prev => {
            const next = { ...prev, [key]: value };
            filtersRef.current = next;
            return next;
        });
    }, []);

    const applyFilters = useCallback(async (newFilters = null) => {
        if (newFilters) {
            setFiltersState(prev => {
                const next = { ...prev, ...newFilters };
                filtersRef.current = next;
                return next;
            });
        }
        await fetchEvents(newFilters || filtersRef.current, 1, pagination.limit || 20);
    }, [fetchEvents, pagination.limit]);

    const clearAllFilters = useCallback(async () => {
        const defaultFilters = {
            category: 'anything',
            tags: [],
            timeFilter: 'anytime',
            startDate: '',
            endDate: '',
            location: '',
            search: ''
        };
        setFiltersState(defaultFilters);
        filtersRef.current = defaultFilters;
        await fetchEvents(defaultFilters, 1, pagination.limit || 20);
    }, [fetchEvents, pagination.limit]);

    const loadPage = useCallback(async (page) => {
        const p = Number(page) || 1;
        await fetchEvents(filtersRef.current, p, pagination.limit || 20);
    }, [fetchEvents, pagination.limit]);

    const searchEvents = useCallback(async (searchTerm) => {
        const next = { ...filtersRef.current, search: searchTerm };
        setFiltersState(next);
        filtersRef.current = next;
        await fetchEvents(next, 1, pagination.limit || 20);
    }, [fetchEvents, pagination.limit]);

    const getActiveFiltersCount = useCallback(() => {
        let count = 0;
        const f = filtersRef.current;
        if (f.category && f.category !== 'anything') count++;
        if (f.tags && f.tags.length > 0) count++;
        if (f.timeFilter && f.timeFilter !== 'anytime') count++;
        if (f.location && String(f.location).trim()) count++;
        if (f.search && String(f.search).trim()) count++;
        if (f.startDate) count++;
        if (f.endDate) count++;
        return count;
    }, []);

    return {
        events,
        pagination,
        filters,
        loading,
        error,
        handleFilterChange,
        applyFilters,
        clearAllFilters,
        loadPage,
        searchEvents,
        refetch: () => fetchEvents(filtersRef.current, pagination.currentPage || 1, pagination.limit || 20),
        activeFiltersCount: getActiveFiltersCount(),
        hasEvents: events.length > 0,
        isEmpty: !loading && events.length === 0
    };
};

export default useEventsFilter;