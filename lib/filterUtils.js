// Filter constants and utilities

export const FILTER_DEFAULTS = {
    WHAT: {
        category: 'ANYTHING',
        tags: []
    },
    WHEN: {
        timeFilter: 'anytime',
        startDate: null,
        endDate: null
    },
    WHERE: {
        location: 'anywhere'
    },
    SEARCH: {
        query: ''
    }
};

export const CATEGORIES = {
    ANYTHING: 'Anything',
    WEEKENDS: 'Weekends',
    DINING: 'Dining',
    SHOPPING: 'Shopping',
    STAY: 'Stay',
    TECH: 'Tech'
};

export const TIME_FILTERS = {
    anytime: 'Anytime',
    today: 'Today',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    custom: 'Custom Date Range'
};

// Utility function to build filter URL params
export const buildFilterParams = (filters) => {
    const params = new URLSearchParams();

    if (filters.category && filters.category !== 'ANYTHING') {
        params.set('category', filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
        params.set('tags', filters.tags.join(','));
    }

    if (filters.startDate) {
        params.set('startDate', filters.startDate);
    }

    if (filters.endDate) {
        params.set('endDate', filters.endDate);
    }

    if (filters.location && filters.location.toLowerCase() !== 'anywhere') {
        params.set('location', filters.location);
    }

    if (filters.search) {
        params.set('search', filters.search);
    }

    if (filters.timeFilter && filters.timeFilter !== 'anytime') {
        params.set('timeFilter', filters.timeFilter);
    }

    return params.toString();
};

// Utility function to parse filter params from URL
export const parseFilterParams = (searchParams) => {
    return {
        category: searchParams.get('category') || 'ANYTHING',
        tags: searchParams.get('tags')?.split(',').map(tag => tag.trim()) || [],
        startDate: searchParams.get('startDate') || null,
        endDate: searchParams.get('endDate') || null,
        location: searchParams.get('location') || 'anywhere',
        search: searchParams.get('search') || '',
        timeFilter: searchParams.get('timeFilter') || 'anytime'
    };
};

// Utility function to validate date inputs
export const validateDateRange = (startDate, endDate) => {
    const errors = [];

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            errors.push('Start date cannot be after end date');
        }

        if (start < new Date().setHours(0, 0, 0, 0)) {
            errors.push('Start date cannot be in the past');
        }
    }

    return errors;
};

// Utility function to format filter summary for display
export const getFilterSummary = (filters) => {
    const summary = [];

    if (filters.category && filters.category !== 'ANYTHING') {
        summary.push(`Category: ${CATEGORIES[filters.category]}`);
    }

    if (filters.tags && filters.tags.length > 0) {
        summary.push(`Tags: ${filters.tags.join(', ')}`);
    }

    if (filters.timeFilter && filters.timeFilter !== 'anytime') {
        summary.push(`When: ${TIME_FILTERS[filters.timeFilter]}`);
    }

    if (filters.location && filters.location.toLowerCase() !== 'anywhere') {
        summary.push(`Location: ${filters.location}`);
    }

    if (filters.search) {
        summary.push(`Search: "${filters.search}"`);
    }

    return summary.length > 0 ? summary.join(' • ') : 'All Events';
};