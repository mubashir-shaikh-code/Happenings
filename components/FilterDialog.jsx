// FilterDialog.jsx
'use client'
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    SlidersHorizontal,
    Filter,
    Tag,
    Calendar,
    MapPin,
} from 'lucide-react';
import ExpandableContent from './ExpandableContent';

const CATEGORIES = {
    anything: 'Anything',
    weekends: 'Weekends',
    dining: 'Dining',
    shopping: 'Shopping',
    stay: 'Stay',
    tech: 'Tech',
};

const TagOptions = [
    'Free', 'Art', 'Trip', 'Cafe', 'Sports', 'Events',
    'Festival', 'Comedy', 'Workshop', 'Exhibition', 'Restaurants', 'Entertainment',
    'Family & Kids', 'Food & Drink', 'Theatre & Musicals', 'Music & Concerts',
];

const TIME_FILTERS = {
    anytime: 'Anytime',
    today: 'Today',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
    nextWeek: 'Next Week',
    thisMonth: 'This Month',
    nextMonth: 'Next Month',
    custom: 'Custom Range',
};

const FilterDialog = ({
    filterOpen,
    setFilterOpen,
    filters,
    handleFilterChange,
    clearAllFilters,
    activeFiltersCount = 0,
    onApply
}) => {
    const handleTagSelect = (tag) => {
        const currentTags = filters.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];

        handleFilterChange('tags', newTags);
    };

    const handleClearAll = () => {
        if (typeof clearAllFilters === 'function') clearAllFilters();
        if (typeof onApply === 'function') onApply();
        setFilterOpen(false)
    };

    const handleApply = () => {
        if (typeof onApply === 'function') onApply();
        setFilterOpen(false);
    };

    return (
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="relative">
                    <SlidersHorizontal className="w-4 h-4 mr-1" />
                    Filters
                    {activeFiltersCount > 0 && (
                        <Badge className="ml-1 h-5 w-5 rounded p-0 flex items-center justify-center text-xs">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-start gap-2">
                        <Filter className="w-5 h-5" />
                        Filter Events
                    </DialogTitle>
                    <DialogDescription className="text-start">
                        Customize your event discovery experience
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            What
                        </Label>
                        <Select
                            value={filters.category}
                            onValueChange={(value) => handleFilterChange('category', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(CATEGORIES).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                            Select Tags
                        </Label>
                        <ExpandableContent
                            type="filter-tags"
                            content={TagOptions}
                            maxVisible={5}
                            selectedTags={filters.tags}
                            onTagSelect={handleTagSelect}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            When
                        </Label>
                        <Select
                            value={filters.timeFilter}
                            onValueChange={(value) => handleFilterChange('timeFilter', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(TIME_FILTERS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {filters.timeFilter === 'custom' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">From</Label>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">To</Label>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Where
                        </Label>
                        <Input
                            placeholder="Enter location or venue"
                            value={filters.location}
                            onChange={(e) => handleFilterChange('location', e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2 pt-4">
                    <Button
                        variant="outline"
                        onClick={handleClearAll}
                        className="flex-1"
                    >
                        Clear All
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleApply}
                        className="flex-1"
                    >
                        Apply Filters
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FilterDialog;