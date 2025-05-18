/**
 * Base64-encoded placeholder image (small backpack)
 * This is used as a fallback when local image loading fails
 */
export const BASE64_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhEAAQAIABAMDAwAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJAAABACwAAAAAEAAQAAACJYyPqcvtD6OctNqLs968+w+G4kiW5omm6sq27gvH8kzX9o3n+gAh+QQJAAABACwAAAAAEAAQAAACIoSPqcvtD12cf85CeLp593w+GIQkJZ6oqrLuC8fyTNf2jeecACH+H0NhdGl2ZSBCYWNrcGFjayBJbWFnZQBJRk7JgAGALyABADs=';

/**
 * Write a placeholder image file to the public directory
 * This can be used by a script that needs to create a default placeholder
 */
export const createPlaceholderFile = (): void => {
  // In a Node.js environment, this would use fs to write the file
  // For browser environments, this is a no-op
  console.log('Creating placeholder file is only available in Node.js environments');
}; 