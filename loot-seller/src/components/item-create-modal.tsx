'use client'

import React from 'react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../@/components/ui/dialog'
import { saveCustomItem } from '../utils/local-storage'
import placeholderBase64 from '../utils/placeholder-base64'
import { capitalize } from '../utils/helpers'

interface ItemCreateModalProps {
    open: boolean
    name: string
    onClose: () => void
    onCreated: () => void
}

export function ItemCreateModal({ open, name, onClose, onCreated }: ItemCreateModalProps) {
    const [value, setValue] = useState('')
    const [imagePreview, setImagePreview] = useState<string>(placeholderBase64)
    const [imageError, setImageError] = useState<string>('')

    function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
            setImageError('Please upload a valid image file (PNG, JPEG, GIF, or WebP)')
            return
        }

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setImageError('Image size should be less than 2MB')
            return
        }

        setImageError('')
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            setImagePreview(base64String)
        }
        reader.readAsDataURL(file)
    }

    function handleCreate() {
        if (!name || !value) return
        saveCustomItem({
            name: capitalize(name),
            value: Number(value),
            imageBase64: imagePreview,
            category: "Custom",
            npcNames: ["Custom"]
        })
        onCreated()
        handleClose()
    }

    const handleClose = () => {
        setValue('')
        setImagePreview(placeholderBase64)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent disabled={value.length == 0}>
                <DialogHeader>
                    <DialogTitle>Create Custom Item</DialogTitle>
                </DialogHeader>
                <div className="mb-4">
                    <label htmlFor="image" className="block mb-2">{name}</label>
                    <div className="flex items-center gap-4">
                        <img
                            src={imagePreview}
                            alt="Item preview"
                            className="w-16 h-16 object-contain border rounded"
                        />
                        <div className="flex-1 font-bold">
                            <input
                                id="image"
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleImageUpload}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-green-50 file:text-green-700
                                    hover:file:bg-green-100"
                            />
                            {imageError && (
                                <p className="mt-1 text-sm text-red-600">{imageError}</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <label htmlFor="value">Value</label>
                    <input
                        id="value"
                        placeholder="0 - 10,000,000"
                        type="number"
                        value={value}
                        min={0}
                        max={10000000}
                        onChange={e => setValue(e.target.value)}
                        className="w-full"
                    />
                </div>
                <button
                    onClick={handleCreate}
                    disabled={!value || isNaN(Number(value)) || Number(value) <= 0 || Number(value) > 10000000}
                    className="create-button"
                >
                    Create
                </button>
            </DialogContent>
        </Dialog>
    )
} 