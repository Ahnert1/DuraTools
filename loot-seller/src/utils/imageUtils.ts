// Default placeholder image path
const PLACEHOLDER_IMAGE = '/images/items/placeholder.gif';

/**
 * Get the local image path for an item
 * @param itemName - The name of the item
 * @param asCssBackground - If true, returns a CSS background-image string with both .png and .gif
 * @returns The path to the image or a CSS background-image string
 */
export const getItemImagePath = (itemName: string, asCssBackground = false): string => {
  try {
    const sanitizedName = itemName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (asCssBackground) {
      // For CSS background-image: try png first, then gif
      return `url('/images/items/${sanitizedName}.png'), url('/images/items/${sanitizedName}.gif')`;
    }
    // Default: just .png (for <img> tags)
    return `/images/items/${sanitizedName}.png`;
  } catch (error) {
    return PLACEHOLDER_IMAGE;
  }
};

/**
 * Image utility to handle image loading errors
 * @param event - The error event
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>): void => {
  try {
    const img = event.currentTarget;
    
    // Check if this is already the placeholder or if we've already tried the placeholder
    if (img.src.includes(PLACEHOLDER_IMAGE) || img.dataset.triedPlaceholder === 'true') {
      // If we've already tried the placeholder, just set an empty alt text
      img.alt = img.alt || 'Item';
      // Remove the error handler to prevent infinite loops
      img.onerror = null;
      return;
    }
    
    // If the current path ends with .png, try .gif instead
    if (img.src.endsWith('.png')) {
      img.src = img.src.replace('.png', '.gif');
      return;
    }
    
    // Mark that we've tried the placeholder
    img.dataset.triedPlaceholder = 'true';
    
    // Set source to our placeholder
    img.src = PLACEHOLDER_IMAGE;
  } catch (error) {
    const img = event.currentTarget;
    img.onerror = null;
  }
}; 