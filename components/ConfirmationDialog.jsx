import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const ConfirmationDialog = ({
    open,
    onOpenChange,
    onConfirm,
    loading,
    title = "Confirm Action",
    description = "Are you sure? This action cannot be undone.",
    confirmText = "Confirm",
    loadingText = "Processing...",
    cancelText = "Cancel",
    icon: Icon = AlertTriangle,
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <Icon className="h-5 w-5 text-orange-500" />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmationDialog;
