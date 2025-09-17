import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, MapPin, Calendar, Tag, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';

const SearchBox = () => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const listRef = useRef(null);

    const handleKeyDown = (e) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    handleSelectSuggestion(suggestions[selectedIndex]);
                } else {
                    handleSearch();
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    };

    const handleInputChange = async (e) => {
        const value = e.target.value;
        setQuery(value);
        setSelectedIndex(-1);

        if (value.length > 0) {
            setIsOpen(true);

            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    q: value.trim(),
                    limit: '8'
                });

                const response = await fetch(`/api/search?${params}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success && data.data?.events) {
                    setSuggestions(data.data.events);
                } else {
                    setSuggestions([]);
                }
            } catch (err) {
                console.error('Search error:', err);
                setError('Failed to fetch suggestions');
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        } else {
            setIsOpen(false);
            setSuggestions([]);
        }
    };

    const handleSelectSuggestion = (event) => {
        setQuery(event.title);
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
        // console.log('Selected event:', event);
    };

    const handleSearch = () => {
        console.log('Searching for:', query);
        setIsOpen(false);
        setSelectedIndex(-1);
    };

    const handleInputFocus = () => {
        if (query.length > 0 && suggestions.length > 0) {
            setIsOpen(true);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selectedIndex >= 0 && listRef.current) {
            setTimeout(() => {
                const selectedElement = listRef.current.children[selectedIndex];
                if (selectedElement) {
                    // Calculate visibility and scroll accordingly
                    const container = listRef.current;
                    const containerTop = container.scrollTop;
                    const containerBottom = containerTop + container.clientHeight;
                    const elementTop = selectedElement.offsetTop;
                    const elementBottom = elementTop + selectedElement.offsetHeight;

                    if (elementTop < containerTop) {
                        container.scrollTop = elementTop;
                    } else if (elementBottom > containerBottom) {
                        container.scrollTop = elementBottom - container.clientHeight;
                    }
                }
            }, 0);
        }
    }, [selectedIndex]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="w-full">
            <div className="relative" ref={dropdownRef}>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        {loading ? (
                            <Loader2 className="h-4 w-4 text-green-500 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4 text-slate-400" />
                        )}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for events, venues, organizers..."
                        className="w-full pl-12 pr-12 py-3 text-sm border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-transparent transition-all duration-200 bg-white"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <ChevronDown
                            className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </div>
                </div>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                        <div ref={listRef} className="max-h-96 overflow-y-auto scroll-smooth">

                            {loading && (
                                <div className="px-4 py-8 text-center">
                                    <Loader2 className="h-6 w-6 mx-auto mb-2 text-green-500 animate-spin" />
                                    <p className="text-sm text-green-500 animate-pulse">Searching events...</p>
                                </div>
                            )}

                            {error && !loading && (
                                <div className="px-4 py-6 text-center">
                                    <p className="text-sm text-red-500">{error}</p>
                                    <p className="text-xs text-slate-400 mt-1">Please try again</p>
                                </div>
                            )}

                            {!loading && !error && suggestions.length > 0 && suggestions.map((event, index) => (
                                <div
                                    key={event.id}
                                    onClick={() => handleSelectSuggestion(event)}
                                    className={`px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-slate-50 last:border-b-0 ${selectedIndex === index
                                        ? 'bg-slate-50'
                                        : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Calendar className={`h-4 w-4 ${selectedIndex === index ? 'text-slate-600' : 'text-slate-400'
                                                }`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="text-sm truncate text-slate-500 font-medium">{event.title}</h4>
                                                    {event.venue && (
                                                        <div className="flex items-center mt-1 text-xs">
                                                            <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                                                            <span className="truncate text-slate-500">{event.venue}</span>
                                                        </div>
                                                    )}
                                                    {event.tags && (
                                                        <div className="flex items-center mt-1 text-xs">
                                                            <Tag className="h-3 w-3 mr-1 text-slate-400" />
                                                            <span className="truncate text-slate-500">{event.category.charAt(0).toUpperCase() + event.category.slice(1).toLowerCase()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {event.startDateTime && (
                                                        <span className="text-xs text-slate-500">
                                                            {formatDate(event.startDateTime)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* No results */}
                            {!loading && !error && query.length > 0 && suggestions.length === 0 && (
                                <div className="px-4 py-8 text-center text-slate-500">
                                    <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>No events found for "{query}"</p>
                                    <p className="text-sm mt-1">Try adjusting your search terms</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchBox;