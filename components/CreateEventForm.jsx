'use client'

import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useState } from 'react'
import Image from 'next/image'
import upload_area from '@/assets/upload_area.png'

const CategoryOptions = ['Anything', 'Weekends', 'Dining', 'Shopping', 'Stay', 'Tech']
const TagOptions = [
  'Free', 'Family & Kids', 'Events', 'Food & Drink', 'Restaurants',
  'Cafe', 'Theatre & Musicals', 'Entertainment', 'Festival',
  'Music & Concerts', 'Art', 'Exhibition', 'Comedy',
  'Sport', 'Workshop', 'Trip', 'Talks'
]

const schema = yup.object().shape({
  organizer: yup.string().required('Organizer is required'),
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  category: yup.string().required('Category is required'),
  tags: yup.array().of(yup.string()).min(1, 'Select at least one tag').required('Tags are required'),
  venue: yup.string().required('Venue is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required'),
  imageUrls: yup.array().of(yup.mixed().nullable())
    .test('at-least-one', 'At least 1 image is required', (value) =>
      Array.isArray(value) && value.some(file => file instanceof File)
    ),
  ticketLink: yup.string().url('Invalid URL').required('Ticket link is required'),
})

const CreateEventForm = () => {
  const [status, setStatus] = useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState([null, null, null])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      imageUrls: [null, null, null],
      tags: [],
    }
  })

  const handleImageChange = (file, index) => {
    setValue(`imageUrls.${index}`, file || null, { shouldValidate: true })
    const newPreviews = [...preview]
    newPreviews[index] = file ? URL.createObjectURL(file) : null
    setPreview(newPreviews)
    trigger('imageUrls')
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    setStatus(null)

    try {
      const formData = new FormData()

      // Non-file fields
      Object.keys(data).forEach((key) => {
        if (key !== "imageUrls") {
          formData.append(key, data[key])
        }
      })

      // Images
      data.imageUrls.forEach((file, idx) => {
        if (file instanceof File) {
          formData.append(`image${idx + 1}`, file)
        }
      })

      const res = await fetch('/api/manage-events/create-event', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {
        setStatus({ type: 'success', msg: 'Event created successfully!' })
        setIsSubmitted(true)
        reset()
        setPreview([null, null, null])
      } else {
        setStatus({ type: 'error', msg: result.error || 'Something went wrong' })
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Request failed. Please try again.' })
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 rounded-xl shadow-lg space-y-6 my-6 border">
      <h2 className="text-2xl font-bold text-center">Create New Event</h2>

      {status && (
        <div
          className={`p-3 rounded text-white ${status.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Images */}
        <div>
          <p className='block font-medium mb-1 capitalize'>Upload Images</p>
          <div className='flex gap-2'>
            {[0, 1, 2].map((idx) => (
              <Controller
                key={idx}
                control={control}
                name={`imageUrls.${idx}`}
                render={() => (
                  <label htmlFor={`image${idx + 1}`}>
                    <Image
                      className='cursor-pointer w-32 h-32 object-cover rounded-lg'
                      src={preview[idx] || upload_area}
                      alt={`img${idx + 1}`}
                      width={128}
                      height={128}
                      unoptimized
                    />
                    <input
                      type="file"
                      id={`image${idx + 1}`}
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        handleImageChange(file, idx)
                      }}
                    />
                  </label>
                )}
              />
            ))}
          </div>
          {errors.imageUrls && (
            <p className="text-red-500 text-sm mt-1">
              {errors.imageUrls.message || errors.imageUrls.root?.message}
            </p>
          )}
        </div>

        {[
          ['organizer', 'Organizer'],
          ['title', 'Title'],
          ['description', 'Description'],
        ].map(([name, label]) => (
          <div key={name}>
            <label className="block font-medium mb-1 capitalize">{label}</label>
            <input
              type="text"
              {...register(name)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors[name] && (
              <p className="text-sm text-red-600 mt-1">{errors[name].message}</p>
            )}
          </div>
        ))}

        {/* Category */}
        <div>
          <label className="block font-medium mb-1">Category</label>
          <select
            {...register('category')}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select a category</option>
            {CategoryOptions.map((cat) => (
              <option key={cat} value={cat.toUpperCase()}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block font-medium mb-1">Tags</label>
          <div className="grid grid-cols-2 gap-2">
            {TagOptions.map((tag) => (
              <label key={tag} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={tag}
                  {...register('tags')}
                  className="form-checkbox"
                />
                <span>{tag}</span>
              </label>
            ))}
          </div>
          {errors.tags && (
            <p className="text-sm text-red-600 mt-1">{errors.tags.message}</p>
          )}
        </div>

        {/* Other Inputs */}
        {[
          ['venue', 'Venue'],
          ['startDate', 'Start Date'],
          ['endDate', 'End Date'],
          ['ticketLink', 'Ticket Link (URL)'],
        ].map(([name, label]) => (
          <div key={name}>
            <label className="block font-medium mb-1 capitalize">{label}</label>
            <input
              type="text"
              {...register(name)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors[name] && (
              <p className="text-sm text-red-600 mt-1">{errors[name].message}</p>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={isSubmitted || isLoading}
          className={`w-full py-2 px-4 font-semibold text-white rounded ${isSubmitted || isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {isLoading ? 'Loading...' : isSubmitted ? 'Submitted' : 'Submit Event'}
        </button>
      </form>
    </div>
  )
}

export default CreateEventForm
