'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User, Mail, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPendingRequests() {
    const [processedToday, setProcessedToday] = useState(0);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);


    const fetchRequests = async () => {
        try {
            setRefreshing(true);
            setLoading(true)
            const response = await fetch('/api/admin/manage-events/pending-requests');
            if (!response.ok) throw new Error('Failed to fetch requests');
            const data = await response.json();
            setRequests(data);
        } catch (err) {
            console.error(err);
        } finally {
            setRefreshing(false);
            setLoading(false)
        }
    };

    const handleStatusChange = async (requestId, newStatus) => {
        setProcessingId(requestId);

        try {

            const response = await fetch('/api/admin/manage-events/pending-requests', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: requestId,
                    status: newStatus,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update status');
            }

            const result = await response.json();
            toast.success(result.message);

            setProcessedToday(prev => prev + 1);

            // Remove the processed request from the list
            setRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleRefresh = () => {
        fetchRequests();
    };
    useEffect(() => {
        fetchRequests();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    useEffect(() => {
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem("processedDate");
        const savedCount = localStorage.getItem("processedCount");

        if (savedDate === today && savedCount) {
            setProcessedToday(parseInt(savedCount, 10)); // restore old count
        } else {
            setProcessedToday(0);
            localStorage.setItem("processedDate", today);
            localStorage.setItem("processedCount", "0");
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("processedCount", processedToday.toString());
    }, [processedToday]);


    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col gap-4 sm:flex-row items-start justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">Pending Event Requests</h1>
                            <p className="text-slate-600">Review and approve event submissions</p>
                        </div>
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

                {loading ? (
                    <div className='flex flex-col gap-10'>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i}>
                                    <CardContent>
                                        <div className='flex gap-4 py-7'>
                                            <div>
                                                <Skeleton className="h-10 w-10" />
                                            </div>
                                            <div className='flex flex-col gap-2'>
                                                <Skeleton className="h-6 w-6" />
                                                <Skeleton className="h-3 w-28" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <div className='flex justify-between'>
                                            <Skeleton className="h-8 w-1/3" />
                                            <Skeleton className="h-5 w-20" />
                                        </div>
                                        <Skeleton className="h-3 w-1/3" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-20 w-full mb-4" />
                                        <div className='flex gap-4'>
                                            <Skeleton className="h-8 w-full" />
                                            <Skeleton className="h-8 w-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <Card>
                                <CardContent className="flex items-center p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Clock className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
                                            <p className="text-sm text-slate-600">Pending Requests</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="flex items-center p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <CheckCircle className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900">{processedToday}</p>
                                            <p className="text-sm text-slate-600">Processed Requests</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="flex items-center p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <Calendar className="h-6 w-6 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900">{requests.filter(r => new Date(r.event.startDateTime) > new Date()).length}</p>
                                            <p className="text-sm text-slate-600">Upcoming Events</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {requests.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="p-4 bg-slate-100 rounded-full">
                                            <CheckCircle className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900">No Pending Requests</h3>
                                            <p className="text-slate-600">All event requests have been processed!</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {requests.map((request) => (
                                    <Card key={request.id} className="hover:shadow-lg transition-shadow duration-200">
                                        <CardHeader>
                                            <div className="flex flex-wrap flex-col sm:flex-row items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-xl mb-2">{request.event.title}</CardTitle>
                                                    <CardDescription className="flex flex-wrap flex-col sm:flex-row sm:items-center sm:gap-1">
                                                        <div className='flex items-center gap-1'>
                                                            <User className="h-4 w-4" />
                                                            <span className='font-semibold'>Requested by:</span>
                                                        </div>
                                                        <div>
                                                            {request.requestedByEmail}
                                                        </div>
                                                    </CardDescription>
                                                </div>
                                                <div>
                                                    <Badge variant="secondary" className="flex items-center gap-1 mt-1 sm:mt-0">
                                                        <Clock className="h-3 w-3" />
                                                        {request.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <p className="text-slate-700 leading-relaxed">
                                                {request.event.description}
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{formatDate(request.event.startDateTime)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{request.event.venue}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Mail className="h-4 w-4" />
                                                    <span>Ends: {formatDate(request.event.endDateTime)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Requested: {formatDate(request.createdAt)}</span>
                                                </div>
                                            </div>

                                            {request.event.adminApproved && (
                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                    Already Approved
                                                </Badge>
                                            )}
                                        </CardContent>

                                        <CardFooter>
                                            {processingId === request.id ? (
                                                <Button
                                                    variant="default"
                                                    disabled
                                                    className="w-full"
                                                >
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                </Button>
                                            ) : (
                                                <div className="flex gap-5 w-full">
                                                    <Button
                                                        onClick={() => handleStatusChange(request.id, 'REJECTED')}
                                                        variant="destructive"
                                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                                    >
                                                        <XCircle className="h-4 w-4 sm:mr-2" />
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleStatusChange(request.id, 'ACCEPTED')}
                                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                                    >
                                                        <CheckCircle className="h-4 w-4 sm:mr-2" />
                                                        Accept
                                                    </Button>
                                                </div>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}