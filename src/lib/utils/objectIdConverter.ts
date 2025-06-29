// src/lib/utils/objectIdConverter.ts
import { ObjectId } from 'mongodb';

/**
 * Converts a string or ObjectId-like value to a valid MongoDB ObjectId.
 * Returns null if the input is not a valid ObjectId format.
 */
export function toObjectId(id: any): ObjectId | null {
  if (id === null || id === undefined) {
    return null;
  }

  let idString: string | null = null;

  // If it's already an ObjectId instance (from mongodb driver or from new ObjectId)
  if (id instanceof ObjectId) {
    idString = id.toHexString(); // Convert ObjectId instance to its hex string
  }
  // If it's a string, use it directly
  else if (typeof id === 'string') {
    idString = id;
  }
  // If it's an object with an 'id' property that's a Buffer (common for raw BSON)
  else if (typeof id === 'object' && id.id instanceof Buffer) {
      try {
          idString = new ObjectId(id.id).toHexString();
      } catch (e) {
          // Stay null if conversion fails
      }
  }

  // Now, validate the string and convert to ObjectId
  if (idString && ObjectId.isValid(idString)) {
    return new ObjectId(idString);
  }

  // Fallback for any other invalid type or failed conversion
  return null;
}

/**
 * Checks if a string is a valid MongoDB ObjectId.
 */
export function isValidObjectIdString(id: string | undefined | null): boolean {
  if (typeof id !== 'string') return false;
  return ObjectId.isValid(id);
}