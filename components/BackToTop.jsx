'use client'

import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BackToTop = ({
    threshold = 400,
    className = "",
    variant = "default",
    size = "icon"
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > threshold) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, [threshold]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    if (!isVisible) {
        return null;
    }

    return (
        <Button
            onClick={scrollToTop}
            variant={variant}
            size={size}
            className={`
        fixed bottom-6 right-6 z-50 
        shadow-lg hover:shadow-xl 
        transition-all duration-300 
        hover:scale-110
        ${className}
      `}
            aria-label="Back to top"
        >
            <ChevronUp className="h-4 w-4" />
        </Button>
    );
};

export default BackToTop;