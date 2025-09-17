'use client'

import React, { useCallback, useEffect, useState } from 'react';
import { Search, Calendar, MapPin, Clock, Filter, Eye, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ExpandableContent from '@/components/ExpandableContent';
import { Skeleton } from '@/components/ui/skeleton';
import BackToTop from '@/components/BackToTop';
import FilterDialog from '@/components/FilterDialog';
import useEventsFilter from './hooks/useEventsFilter';
import { debounce } from 'lodash';
import SearchBox from '@/components/Search';

const SkeletonCard = () => {
  return (
    <Card className="overflow-hidden pt-0">
      <Skeleton className="h-56 w-full" />
      <CardContent className="space-y-4 p-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 flex-3 rounded" />
          <Skeleton className="h-10 flex-1 rounded" />
        </div>
      </CardContent>
    </Card>
  );
};

const SkeletonGrid = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

const EventsPage = () => {
  const {
    events,
    pagination,
    filters,
    error,
    handleFilterChange,
    applyFilters,
    clearAllFilters:
    loadPage,
    searchEvents,
    activeFiltersCount,
  } = useEventsFilter();

  const [sortBy, setSortBy] = useState('newest');
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        // Your API call to fetch suggestions
        const response = await fetch(`/api/search-suggestions?q=${query}`);
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0) {
          setSuggestions(suggestions[activeSuggestion]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        break;
    }
  };

  const resetFiltersLocally = useCallback(() => {
    const defaultFilters = {
      category: 'anything',
      tags: [],
      timeFilter: 'anytime',
      startDate: '',
      endDate: '',
      location: '',
      search: ''
    };

    Object.entries(defaultFilters).forEach(([k, v]) => handleFilterChange(k, v));
  }, [handleFilterChange]);

  const handleApplyFromDialog = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  // useEffect(() => {
  //   const t = setTimeout(() => {
  //     searchEvents(searchTerm);
  //   }, 450);

  //   return () => clearTimeout(t);
  // }, [searchTerm, searchEvents]);

  const parseTags = (tagsData) => {
    if (!tagsData) return [];
    if (Array.isArray(tagsData)) {
      return tagsData.map(tag => String(tag).trim()).filter(Boolean);
    }
    if (typeof tagsData === 'string') {
      return tagsData.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    return [];
  };

  const parseImageUrls = (imageUrlsData) => {
    if (!imageUrlsData) return [];
    if (Array.isArray(imageUrlsData)) return imageUrlsData;
    if (typeof imageUrlsData === 'string') return imageUrlsData.split(',').map(u => u.trim()).filter(Boolean);
    return [];
  };

  const filteredAndSortedEvents = (events || [])
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.startDateTime) - new Date(a.startDateTime);
        case 'oldest':
          return new Date(a.startDateTime) - new Date(b.startDateTime);
        default:
          return 0;
      }
    });

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Date TBD';
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    };
  };

  const EventCard = ({ event }) => {
    const startDateTime = formatDateTime(event.startDateTime);
    const endDateTime = formatDateTime(event.endDateTime);
    const tags = parseTags(event.tags);
    const imageUrls = parseImageUrls(event.imageUrls);

    return (
      <Card
        className="group overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 pt-0"
      >
        {imageUrls.length > 0 && (
          <div className="relative h-56 overflow-hidden">
            <img
              src={imageUrls[0]}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 right-3">
              {event.category && (
                <Badge className="bg-primary text-primary-foreground">
                  {event.category}
                </Badge>
              )}
            </div>
          </div>
        )}
        <CardContent className="space-y-2">
          <CardTitle className="text-xl">
            {event.title}
          </CardTitle>
          <CardDescription>
            <span className='font-medium'>Organized by:</span> {event.organizer}
          </CardDescription>
          {event.description && (
            <CardDescription>
              <ExpandableContent
                type="description"
                content={event.description}
                maxLines={1}
                characterLimit={150}
              />
            </CardDescription>
          )}

          <div className="space-y-2">
            {event.startDateTime && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <div>
                  <div>Start: {startDateTime.date} at {startDateTime.time}</div>
                </div>
              </div>
            )}

            {event.endDateTime && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <div>
                  <div>End: {endDateTime.date} at {endDateTime.time}</div>
                </div>
              </div>
            )}

            {event.venue && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            )}
          </div>

          <ExpandableContent
            type="tags"
            content={tags}
            maxVisible={3}
          />

          <div className="flex items-center gap-2 pt-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-3"
            >
              Get Pass
            </Button>
            <Heart
              variant="outline"
              className="flex-1 text-gray-500 size-9"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-4">
            Discover Amazing Events
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find and join events that match your interests, schedule, and location
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-5xl mx-auto mb-10">
          <SearchBox />

          <div className='flex justify-between gap-4'>
            <div>
              <FilterDialog
                filterOpen={filterOpen}
                setFilterOpen={setFilterOpen}
                filters={filters}
                handleFilterChange={handleFilterChange}
                clearAllFilters={resetFiltersLocally}
                activeFiltersCount={activeFiltersCount}
                onApply={handleApplyFromDialog}
              />
            </div>
            <div>
              <Select value={sortBy} onValueChange={setSortBy} disabled={loading}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredAndSortedEvents.length > 0 && (
            <div className="">
              <Badge variant="outline">
                Showing {filteredAndSortedEvents.length} event{filteredAndSortedEvents.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}

          {/* Display current filters for debugging */}
          {/* <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Current Filters:</h3>
            <pre className="text-sm">{JSON.stringify(filters, null, 2)}</pre>
          </div> */}
        </div>

        <div className="max-w-7xl mx-auto">
          {loading ? (
            <SkeletonGrid count={8} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredAndSortedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => loadPage(Math.max(1, pagination.currentPage - 1))}
              disabled={!pagination.hasPrevPage || loading}
            >
              Prev
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              onClick={() => loadPage(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={!pagination.hasNextPage || loading}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <BackToTop
        threshold={300}
        variant="default"
        className=""
      />
    </div>
  );
};

export default EventsPage;