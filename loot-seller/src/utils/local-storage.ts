import { ExtendedItemData } from "../models/ExtendedItemData"

const STORAGE_KEY = 'customItems'

export function getCustomItems(): ExtendedItemData[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
}

export function saveCustomItem(item: ExtendedItemData) {
    const items = getCustomItems()
    items.push(item)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function deleteCustomItem(name: string): ExtendedItemData[] {
    const items = getCustomItems()
    const newItems = items.filter(item => item.name !== name)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))
    return newItems
}
