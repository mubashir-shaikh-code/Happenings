'use client'

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, Search, Filter, RefreshCw, Eye, Edit, Trash2, Loader2 } from 'lucide-react';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import EditEventDialog from './EditEventDialog';
import ConfirmationDialog from './ConfirmationDialog';
import ExpandableContent from './ExpandableContent';
import { useUser } from '@clerk/nextjs';

const ListedEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('table');
    const [eventToDelete, setEventToDelete] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const { user } = useUser()

    const handleActionClick = (event, action) => {
        if (action === 'edit') {
            setSelectedEvent(event);
            setEditDialogOpen(true);
        } else if (action === 'delete') {
            setEventToDelete(event);
        }
    };

    const fetchEvents = async () => {
        try {
            setRefreshing(true);
            setLoading(true);

            const role = user?.publicMetadata?.role || "CREATOR";
            const url =
                role === "ADMIN"
                    ? "/api/admin/manage-events/listed-events"
                    : "/api/creator/manage-events/listed-events";

            const response = await fetch(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }

            const data = await response.json();
            setEvents(data);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDeleteEvent = async (event) => {

        try {
            setDeleteLoading(true);
            const eventId = event.id
            console.log("eventId", eventId);

            const role = user?.publicMetadata?.role || "CREATOR";
            const url =
                role === "ADMIN"
                    ? "/api/admin/manage-events/listed-events"
                    : "/api/creator/manage-events/listed-events";

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ eventId }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event (client):', error);
        } finally {
            setDeleteLoading(false);
            setEventToDelete(null);
            handleRefresh()
        }
    };


    const handleRefresh = () => {
        fetchEvents();
    };
    useEffect(() => {
        fetchEvents();
    }, []);

    const parseTags = (tagsString) => {
        if (!tagsString) return [];
        try {
            return tagsString.split(', ').map(tag => tag.trim()).filter(Boolean);
        } catch {
            return [];
        }
    };

    const parseImageUrls = (imageUrlsString) => {
        if (!imageUrlsString) return [];
        try {
            return imageUrlsString.split(', ').map(url => url.trim()).filter(Boolean);
        } catch {
            return [];
        }
    };

    // Filter and sort events
    const filteredAndSortedEvents = events
        .filter(event => {
            if (!searchTerm.trim()) return true;
            const searchLower = searchTerm.toLowerCase().trim();

            return (
                event.title?.toLowerCase().includes(searchLower) ||
                event.organizer?.toLowerCase().includes(searchLower) ||
                event.description?.toLowerCase().includes(searchLower) ||
                event.venue?.toLowerCase().includes(searchLower) ||
                event.category?.toLowerCase().includes(searchLower) ||
                parseTags(event.tags).some(tag => tag.toLowerCase().includes(searchLower))
            );
        })
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

    const formatDateTime = (dateTime) => {
        if (!dateTime) return 'Date TBD';
        const date = new Date(dateTime);
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

    if (loading) {
        return (
            <div className="container mx-auto">
                <Card>
                    <CardHeader>
                        <div className='flex flex-col gap-4 sm:flex-row items-start justify-between'>
                            <div className='space-y-2'>
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-2 w-64" />
                            </div>
                            <div className='flex gap-2'>
                                <Skeleton className="h-8 w-28" />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                        <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                        <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                        <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                        <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                        <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[1, 2, 3].map((i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:pb-2">
                    <div>
                        <CardTitle>My Listed Events</CardTitle>
                        <CardDescription>
                            Manage and view all your published events
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                        >
                            <Eye className="mt-0.5 mr-1 h-4 w-4" />
                            {viewMode === 'table' ? 'Grid View' : 'Table View'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search and Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search events by title, organizer, venue, category"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full md:w-48">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {filteredAndSortedEvents.length === 0 ? (
                        <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
                            <div className="text-center">
                                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium">
                                    {searchTerm ? 'No events found' : 'No events available'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {searchTerm
                                        ? 'Try adjusting your search terms or filters.'
                                        : 'Create your first event to get started!'
                                    }
                                </p>
                            </div>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event Title</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Venue</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedEvents.map((event) => {
                                        const startDateTime = formatDateTime(event.startDateTime);
                                        const endDateTime = formatDateTime(event.endDateTime);

                                        return (
                                            <TableRow key={event.id}>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <div className="font-semibold">{event.title}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            by {event.organizer}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div>{startDateTime.date}</div>
                                                        <div className="text-muted-foreground">{startDateTime.time}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div>{endDateTime.date}</div>
                                                        <div className="text-muted-foreground">{endDateTime.time}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <span className="truncate max-w-32">{event.venue || 'TBD'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {event.category && (
                                                        <Badge variant="secondary">
                                                            {event.category}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleActionClick(event, 'delete')}
                                                            disabled={loading}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleActionClick(event, 'edit')}
                                                            disabled={loading}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        /* Grid View */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredAndSortedEvents.map((event) => {
                                const startDateTime = formatDateTime(event.startDateTime);
                                const endDateTime = formatDateTime(event.endDateTime);
                                const tags = parseTags(event.tags);
                                const imageUrls = parseImageUrls(event.imageUrls);

                                return (
                                    <Card
                                        key={event.id}
                                        className="group overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 pt-0"
                                    >
                                        {/* Event Image */}
                                        {imageUrls.length > 0 && (
                                            <div className="relative h-52 overflow-hidden">
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

                                            <div className="flex items-center justify-between gap-2 pt-4">
                                                <Button
                                                    variant="destructive"
                                                    size="lg"
                                                    onClick={() => handleActionClick(event, 'delete')}
                                                    disabled={loading}
                                                    className="flex-1"
                                                >

                                                    <Trash2 className="h-3 w-3" /> Delete
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    onClick={() => handleActionClick(event, 'edit')}
                                                    disabled={loading}
                                                    className="flex-1"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    Edit
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    <EditEventDialog
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        event={selectedEvent}
                        onEventUpdated={handleRefresh}
                    />

                    <ConfirmationDialog
                        open={eventToDelete}
                        onOpenChange={() => setEventToDelete(null)}
                        onConfirm={() => handleDeleteEvent(eventToDelete)}
                        loading={deleteLoading}
                    />

                    {filteredAndSortedEvents.length > 0 && (
                        <div className="flex justify-between items-center mt-6 text-sm text-muted-foreground">
                            <p>
                                Showing {filteredAndSortedEvents.length} event{filteredAndSortedEvents.length !== 1 ? 's' : ''}
                                {searchTerm && ` matching "${searchTerm}"`}
                            </p>
                            <p>
                                View: {viewMode === 'table' ? 'Table' : 'Grid'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ListedEvents;