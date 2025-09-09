'use client'

import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useRef, useState } from 'react'
import { Calendar, Clock, MapPin, Upload, X, Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'

const CategoryOptions = ['Anything', 'Weekends', 'Dining', 'Shopping', 'Stay', 'Tech']
const TagOptions = [
  'Free', 'Art', 'Trip', 'Cafe', 'Sports', 'Events',
  'Festival', 'Comedy', 'Workshop', 'Exhibition', 'Restaurants', 'Entertainment',
  'Family & Kids', 'Food & Drink', 'Theatre & Musicals', 'Music & Concerts',
]

const schema = yup.object().shape({
  organizer: yup.string().required('Organizer is required'),
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  category: yup.string().required('Category is required'),
  tags: yup.array().of(yup.string()).min(1, 'Select at least one tag'),
  venue: yup.string().required('Venue is required'),
  startDate: yup.string().required('Start date & time is required'),
  endDate: yup.string().test('end-after-start', 'Must be greater than start date & time', function (value) {
    const { startDate } = this.parent;
    if (!startDate || !value) return true;
    return new Date(value) > new Date(startDate);
  }).required('End date & time is required'),
  imageUrls: yup.array()
    .test('at-least-one', 'At least 1 image is required', function (value) {
      if (!Array.isArray(value)) return false;
      return value.some(file => file instanceof File);
    }),
  ticketLink: yup.string().url('Invalid URL').required('Ticket link is required'),
})

const CreateEventForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState([null, null, null])
  const [selectedTags, setSelectedTags] = useState([])
  const inputRefs = useRef([])
  const { user } = useUser()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    trigger,
    watch,
  } = useForm({
    resolver: yupResolver(schema),

  })

  const handleImageChange = (file, idx) => {
    if (!file) return

    const url = URL.createObjectURL(file);
    setPreview((p) => {
      const copy = [...p];
      if (copy[idx]) URL.revokeObjectURL(copy[idx]);
      copy[idx] = url;
      return copy;
    });

    setValue(`imageUrls.${idx}`, file, { shouldValidate: true })
    trigger('imageUrls')
  }

  const handleRemoveImage = (idx) => {
    setPreview((p) => {
      const copy = [...p];
      if (copy[idx]) {
        URL.revokeObjectURL(copy[idx]);
      }
      copy[idx] = null;
      return copy;
    });

    setValue(`imageUrls.${idx}`, null, { shouldValidate: true });
    if (inputRefs.current[idx]) inputRefs.current[idx].value = '';
    trigger('imageUrls')
  }

  const handleTagChange = (tag, checked) => {
    let newTags
    if (checked) {
      newTags = [...selectedTags, tag]
    } else {
      newTags = selectedTags.filter(t => t !== tag)
    }
    setSelectedTags(newTags)
    setValue('tags', newTags, { shouldValidate: true })
  }

  const onSubmit = async (data) => {
    setIsLoading(true)

    try {
      const formData = new FormData()

      formData.append('organizer', data.organizer)
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('category', data.category)
      formData.append('venue', data.venue)
      formData.append('startDate', data.startDate)
      formData.append('endDate', data.endDate)
      formData.append('ticketLink', data.ticketLink)

      data.tags.forEach(tag => {
        formData.append('tags', tag)
      })

      data.imageUrls.forEach((file, idx) => {
        if (file instanceof File) {
          formData.append(`image${idx + 1}`, file)
        }
      })

      const role = user?.publicMetadata?.role || "CREATOR";
      const url =
        role === "ADMIN"
          ? "/api/admin/manage-events/create-event"
          : "/api/creator/manage-events/create-event";

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const result = await res.json()

      if (res.ok) {
        if (role === "ADMIN") {
          toast.success("Event created successfully");
        } else {
          toast.success("Request submitted, now you can track it.");
        }
        setIsSubmitted(true)
        reset()
        setPreview([null, null, null])
        setSelectedTags([])
      } else {
        toast.error("Something went wrong")
      }
    } catch (err) {
      toast.error("Server Error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl lg:max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Create New Event
          </CardTitle>
          <p className="text-muted-foreground">
            Fill in the details below to create your event
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-2">
              <div>
                <Label className="flex items-center gap-2 text-xl font-semibold">
                  <Upload className="h-5 w-5" />
                  Event Images
                </Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="relative group w-full">
                    <Controller
                      control={control}
                      name={`imageUrls.${idx}`}
                      render={({ field, fieldState }) => (
                        <label htmlFor={`image${idx + 1}`} className="cursor-pointer block">
                          <div className={`relative w-full h-52 sm:h-40 border-2 border-dashed rounded-lg overflow-hidden transition-all duration-200 bg-gray-50/80 ${errors.imageUrls ? 'border-red-500' : 'border-gray-300'
                            }`}>
                            {preview[idx] ? (
                              <>
                                <img
                                  src={preview[idx]}
                                  alt={`Preview ${idx + 1}`}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveImage(idx);
                                  }}
                                  aria-label={`Remove image ${idx + 1}`}
                                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                  <X className="h-4 w-4 text-gray-600 cursor-pointer" />
                                </button>
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="flex items-center justify-center rounded-full border border-dashed h-12 w-12 mb-2 border-gray-400" >
                                  <Upload className="h-6 w-6 text-gray-400" />
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-center text-gray-600">
                                  Upload Image
                                </span>
                                <span className="text-xs text-gray-400 text-center">Click to browse</span>
                              </div>
                            )}

                            <div className="absolute bottom-2 left-2 h-6 w-6 flex items-center justify-center bg-white text-gray-600 cursor-default text-xs font-medium rounded-full">
                              {idx + 1}
                            </div>
                          </div>

                          <Input
                            type="file"
                            id={`image${idx + 1}`}
                            accept="image/*"
                            ref={(el) => (inputRefs.current[idx] = el)}
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageChange(file, idx);
                              }
                            }}
                          />
                        </label>
                      )}
                    />
                  </div>
                ))}
              </div>

              {errors.imageUrls && (
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p>{errors.imageUrls.message || errors.imageUrls.root?.message}</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="organizer">Organizer</Label>
                  <Input
                    id="organizer"
                    placeholder="Enter organizer name"
                    {...register('organizer')}
                    className={errors.organizer ? 'border-red-500' : ''}
                  />
                  {errors.organizer && (
                    <div className="flex items-center gap-1 text-red-600 text-xs">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p>{errors.organizer.message || errors.organizer.root?.message}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter event title"
                    {...register('title')}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <div className="flex items-center gap-1 text-red-600 text-xs">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p>{errors.title.message || errors.title.root?.message}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event..."
                  rows={4}
                  maxLength={191}
                  {...register('description')}
                  className={`${errors.description ? 'border-red-500' : ''} pr-12`}
                />

                {/* Character counter */}
                <span className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {watch('description')?.length || 0}/191
                </span>

                {errors.description && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p>{errors.description.message || errors.description.root?.message}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Category & Tags</h3>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CategoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat.toUpperCase()}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p>{errors.category.message || errors.category.root?.message}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {TagOptions.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={tag}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={(checked) => handleTagChange(tag, checked)}
                      />
                      <Label
                        htmlFor={tag}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {errors.tags && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p>{errors.tags.message || errors.tags.root?.message}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Event Details</h3>

              <div className="space-y-2">
                <Label htmlFor="venue" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Venue
                </Label>
                <Input
                  id="venue"
                  placeholder="Enter venue location"
                  {...register('venue')}
                  className={errors.venue ? 'border-red-500' : ''}
                />
                {errors.venue && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p>{errors.venue.message || errors.venue.root?.message}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    {...register('startDate')}
                    className={errors.startDate ? 'border-red-500' : ''}
                  />
                  {errors.startDate && (
                    <div className="flex items-center gap-1 text-red-600 text-xs">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p>{errors.startDate.message || errors.startDate.root?.message}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    {...register('endDate')}
                    className={errors.endDate ? 'border-red-500' : ''}
                  />
                  {errors.endDate && (
                    <div className="flex items-center gap-1 text-red-600 text-xs">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p>{errors.endDate.message || errors.endDate.root?.message}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketLink">Ticket Link</Label>
                <Input
                  id="ticketLink"
                  type="url"
                  placeholder="https://example.com/tickets"
                  {...register('ticketLink')}
                  className={errors.ticketLink ? 'border-red-500' : ''}
                />
                {errors.ticketLink && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p>{errors.ticketLink.message || errors.ticketLink.root?.message}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitted || isLoading}
                className="w-full"
                variant='default'
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  </>
                ) : isSubmitted ? (
                  <>
                    Event Created
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateEventForm