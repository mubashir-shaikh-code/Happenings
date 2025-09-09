'use client'

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MapPin, User, Edit, Loader2 } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';
import { useUser } from '@clerk/nextjs';

const validationSchema = yup.object({
    title: yup.string().required('Title is required'),
    organizer: yup.string().required('Organizer is required'),
    venue: yup.string().required('Venue is required'),
    startDateTime: yup.string().required('Start date & time is required'),
    endDateTime: yup.string().test('end-after-start', 'End date & time must be greater than start date', function (value) {
        const { startDateTime } = this.parent;
        if (!startDateTime || !value) return true;
        return new Date(value) > new Date(startDateTime);
    }).required('End date & time is required')
});

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateForAPI = (datetimeLocalString) => {
    if (!datetimeLocalString) return '';
    try {
        const date = new Date(datetimeLocalString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString();
    } catch (error) {
        console.error('Error formatting date for API:', error);
        return datetimeLocalString;
    }
};

const ErrorIcon = () => (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const EditEventDialog = ({ open, onOpenChange, event, onEventUpdated }) => {
    const [originalData, setOriginalData] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useUser()

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isValid }
    } = useForm({
        resolver: yupResolver(validationSchema),
        mode: 'onChange'
    });

    const watchedValues = watch();

    useEffect(() => {
        if (event && open) {
            const initialData = {
                title: event.title || '',
                organizer: event.organizer || '',
                startDateTime: formatDateForInput(event.startDateTime),
                endDateTime: formatDateForInput(event.endDateTime),
                venue: event.venue || '',
            };
            reset(initialData);
            setOriginalData(initialData);
        }
    }, [event, open, reset]);

    const hasChanges = () => {
        if (!originalData || Object.keys(originalData).length === 0) return false;
        return (
            watchedValues.title?.trim() !== originalData.title ||
            watchedValues.organizer?.trim() !== originalData.organizer ||
            watchedValues.startDateTime !== originalData.startDateTime ||
            watchedValues.endDateTime !== originalData.endDateTime ||
            watchedValues.venue?.trim() !== originalData.venue
        );
    };

    const handleSaveClick = (e) => {
        e.preventDefault();
        setShowConfirmation(true);
    };

    const handleConfirmSave = async () => {
        handleSubmit(async (formData) => {
            try {
                setLoading(true);

                const updateData = {
                    eventId: event.id,
                    title: formData.title.trim(),
                    organizer: formData.organizer.trim(),
                    startDateTime: formatDateForAPI(formData.startDateTime),
                    endDateTime: formatDateForAPI(formData.endDateTime),
                    venue: formData.venue.trim(),
                };

                const role = user?.publicMetadata?.role || "CREATOR";
                const url =
                    role === "ADMIN"
                        ? "/api/admin/manage-events/listed-events"
                        : "/api/creator/manage-events/listed-events";

                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateData),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to update event');
                }

                onEventUpdated?.();

            } catch (error) {
                console.error('Error updating event:', error);
                alert('Failed to update event. Please try again.');
            } finally {
                setLoading(false);
                setShowConfirmation(false);
                onOpenChange(false);
            }
        })();
    };

    const handleCancel = () => {
        onOpenChange(false);
        reset(originalData);
    };

    const canSave = isValid && watchedValues.title?.trim() && hasChanges();

    const renderField = (id, label, icon, type = 'text', placeholder = '') => (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-medium text-gray-700 flex items-center gap-2">
                {icon}
                {label}
            </Label>
            <Input
                id={id}
                type={type}
                {...register(id)}
                placeholder={placeholder}
                className={`w-full ${errors[id] ? 'border-red-500' : ''}`}
            />
            {errors[id] && (
                <div className="flex items-center gap-1 text-red-600 text-xs">
                    <ErrorIcon />
                    <p>{errors[id].message}</p>
                </div>
            )}
        </div>
    );

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-800">
                            Edit Event
                        </DialogTitle>
                        <DialogDescription>
                            Update the event details below. All changes will be apply immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveClick} className="space-y-6">
                        {renderField('title', 'Event Title', <Edit className="h-4 w-4" />, 'text', 'Enter event title')}
                        {renderField('organizer', 'Organizer', <User className="h-4 w-4" />, 'text', 'Enter organizer name')}
                        {renderField('startDateTime', 'Start Date & Time', <Calendar className="h-4 w-4" />, 'datetime-local')}
                        {renderField('endDateTime', 'End Date & Time', <Clock className="h-4 w-4" />, 'datetime-local')}
                        {renderField('venue', 'Venue', <MapPin className="h-4 w-4" />, 'text', 'Enter event venue')}
                    </form>

                    <DialogFooter className="flex gap-3 pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={loading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            onClick={handleSaveClick}
                            disabled={!canSave || loading}
                            className="flex-1"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmationDialog
                open={showConfirmation}
                onOpenChange={setShowConfirmation}
                onConfirm={handleConfirmSave}
                loading={loading}
            />
        </>
    );
};

export default EditEventDialog