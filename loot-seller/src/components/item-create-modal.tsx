'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../@/components/ui/dialog'
import { saveCustomItem, updateCustomItem, getCustomItems } from '../utils/local-storage'
import placeholderBase64 from '../utils/placeholder-base64'
import { capitalize } from '../utils/helpers'
import { ExtendedItemData } from '../models/ExtendedItemData'

interface ItemCreateModalProps {
    open: boolean
    name: string
    onClose: () => void
    onCreated: () => void
    isEditMode?: boolean
    itemToEdit?: ExtendedItemData | null
}

export function ItemCreateModal({ open, name, onClose, onCreated, isEditMode = false, itemToEdit = null }: ItemCreateModalProps) {
    const [value, setValue] = useState('')
    const [imagePreview, setImagePreview] = useState<string>(placeholderBase64)
    const [imageError, setImageError] = useState<string>('')
    const [npcNames, setNpcNames] = useState<string[]>([])
    const [newNpcName, setNewNpcName] = useState('')
    const [editMode, setEditMode] = useState(false)
    const [originalItemName, setOriginalItemName] = useState<string>('')

    // Load item data when editing
    useEffect(() => {
        if (isEditMode && itemToEdit) {
            setValue(itemToEdit.value.toString())
            setImagePreview(itemToEdit.imageBase64 || placeholderBase64)
            setNpcNames(itemToEdit.npcNames.filter(name => name !== "Custom - No names were provided"))
            setOriginalItemName(itemToEdit.name)
            setEditMode(true)
        } else if (!isEditMode) {
            // Reset form for create mode
            setValue('')
            setImagePreview(placeholderBase64)
            setNpcNames([])
            setNewNpcName('')
            setEditMode(false)
            setOriginalItemName('')
        }
    }, [isEditMode, itemToEdit])

    // Handle INSERT key for edit mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Insert' && !isEditMode) {
                e.preventDefault()
                // Find the item to edit based on current name
                const customItems = getCustomItems()
                const itemToEdit = customItems.find(item =>
                    item.name.toLowerCase() === name.toLowerCase()
                )
                if (itemToEdit) {
                    setValue(itemToEdit.value.toString())
                    setImagePreview(itemToEdit.imageBase64 || placeholderBase64)
                    setNpcNames(itemToEdit.npcNames.filter(name => name !== "Custom - No names were provided"))
                    setOriginalItemName(itemToEdit.name)
                    setEditMode(true)
                }
            }
        }

        if (open) {
            document.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open, name, isEditMode])

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

    function handleAddNpc() {
        if (newNpcName.trim() && !npcNames.includes(newNpcName.trim())) {
            // Capitalize each word in the NPC name
            const capitalizedName = newNpcName.trim().split(' ').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            setNpcNames([...npcNames, capitalizedName])
            setNewNpcName('')
        }
    }

    function handleRemoveNpc(index: number) {
        setNpcNames(npcNames.filter((_, i) => i !== index))
    }

    function handleCreate() {
        if (!name || !value) return

        const itemData = {
            name: capitalize(name),
            value: Number(value),
            imageBase64: imagePreview,
            category: "Custom",
            npcNames: npcNames.length > 0 ? npcNames : ["Custom - No names were provided"]
        }

        if (editMode && originalItemName) {
            updateCustomItem(originalItemName, itemData)
        } else {
            saveCustomItem(itemData)
        }

        onCreated()
        handleClose()
    }

    const handleClose = () => {
        setValue('')
        setImagePreview(placeholderBase64)
        setNpcNames([])
        setNewNpcName('')
        setEditMode(false)
        setOriginalItemName('')
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent disabled={value.length == 0}>
                <DialogHeader>
                    <DialogTitle>{editMode ? 'Edit Custom Item' : 'Create Custom Item'}</DialogTitle>
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
                    <label htmlFor="value">*Value</label>
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
                <div className="mb-4">
                    <label htmlFor="npc-names" className="block mb-2">NPCs that sell this item (Optional)</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            id="npc-names"
                            type="text"
                            placeholder="Custom NPC Name"
                            value={newNpcName}
                            onChange={e => setNewNpcName(e.target.value)}
                            onKeyPress={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddNpc()
                                }
                            }}
                            className="flex-1"
                        />
                        <button
                            onClick={handleAddNpc}
                            disabled={!newNpcName.trim() || npcNames.includes(newNpcName.trim().split(' ').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            ).join(' '))}
                            className="w-10 h-10 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200 shadow-md hover:shadow-lg"
                            title="Add NPC"
                        >
                            +
                        </button>
                    </div>
                    {npcNames.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {npcNames.map((npc, index) => (
                                <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                    <span className="text-sm">{npc}</span>
                                    <button
                                        onClick={() => handleRemoveNpc(index)}
                                        className="remove-npc-btn text-red-500 hover:text-red-700 text-sm font-bold transition-colors duration-200"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {npcNames.length === 0 && (
                        <p className="text-sm text-gray-500">No NPCs added. Item will be marked as "Custom".</p>
                    )}
                </div>
                <button
                    onClick={handleCreate}
                    disabled={!value || isNaN(Number(value)) || Number(value) <= 0 || Number(value) > 10000000}
                    className="create-button"
                >
                    {editMode ? 'Update' : 'Create'}
                </button>
            </DialogContent>
        </Dialog>
    )
} 