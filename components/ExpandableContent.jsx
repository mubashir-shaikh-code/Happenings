'use client'

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';

const ExpandableContent = ({
  type = 'description',
  content,
  maxLines = 3,
  maxVisible = 3,
  characterLimit = 150,
  selectedTags = [],
  onTagSelect = () => { },
  isFilterMode = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content || (Array.isArray(content) && content.length === 0)) return null;

  // For description type
  if (type === 'description') {
    const needsTruncation = content.length > characterLimit;

    return (
      <div className="text-muted-foreground text-sm leading-relaxed">
        <p className={`${!isExpanded && needsTruncation ? `line-clamp-${maxLines}` : ''}`}>
          <span className='font-medium'>Description: </span>{content}
        </p>

        {needsTruncation && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:underline text-xs font-medium transition-colors duration-200 cursor-pointer"
          >
            {isExpanded ? 'See less' : 'See more'}
          </button>
        )}
      </div>
    );
  }

  if (type === 'tags') {
    const shouldShowToggle = content.length > maxVisible;
    const visibleTags = isExpanded ? content : content.slice(0, maxVisible);

    return (
      <div className="flex flex-wrap gap-1 mt-3">
        {visibleTags.map((tag, index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-xs px-2 py-1"
          >
            {tag}
          </Badge>
        ))}

        {shouldShowToggle && (
          <Badge
            variant="outline"
            className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded
              ? 'See less'
              : `+${content.length - maxVisible} more`
            }
          </Badge>
        )}
      </div>
    );
  }

  if (type === 'filter-tags') {
    const shouldShowToggle = content.length > maxVisible;
    const visibleTags = isExpanded ? content : content.slice(0, maxVisible);

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {visibleTags.map((tag, index) => {
            const isSelected = selectedTags.includes(tag);

            return (
              <Badge
                key={index}
                variant={isSelected ? "secondary" : "outline"}
                className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onTagSelect(tag)}
              >
                {tag}
              </Badge>
            );
          })}

          {shouldShowToggle && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded
                ? 'See less'
                : `+${content.length - maxVisible} more`
              }
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ExpandableContent;