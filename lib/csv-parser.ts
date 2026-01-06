/**
 * CSV Parser utility for bulk product import
 * Handles parsing, column detection, and data transformation
 */

import { toSmallestUnit, getStoreCurrency } from "./currencies";

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  rowCount: number;
}

export interface ColumnMapping {
  name: number | null;
  description: number | null;
  price: number | null;
  images: number | null;
  category: number | null;
  is_digital: number | null;
  track_inventory: number | null;
  inventory_count: number | null;
}

export interface ParsedProduct {
  name: string;
  description: string;
  price: number; // in cents
  images: string[];
  category: string;
  is_digital: boolean;
  track_inventory: boolean;
  inventory_count: number | null;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

/**
 * Parse CSV content into headers and rows
 * Handles newlines within quoted fields correctly
 */
export function parseCSV(content: string): CSVParseResult {
  if (!content.trim()) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted field
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === "," && !inQuotes) {
      // Field separator
      currentRow.push(currentField.trim());
      currentField = "";
      i++;
      continue;
    }

    // Handle newlines (CRLF or LF)
    if ((char === "\r" && nextChar === "\n") || char === "\n") {
      if (inQuotes) {
        // Newline inside quoted field - keep it
        currentField += "\n";
        i += char === "\r" ? 2 : 1;
        continue;
      } else {
        // End of row
        currentRow.push(currentField.trim());
        // Only add non-empty rows
        if (currentRow.some(field => field !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
        i += char === "\r" ? 2 : 1;
        continue;
      }
    }

    // Regular character
    currentField += char;
    i++;
  }

  // Handle last field/row (no trailing newline)
  currentRow.push(currentField.trim());
  if (currentRow.some(field => field !== "")) {
    rows.push(currentRow);
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return {
    headers,
    rows: dataRows,
    rowCount: dataRows.length,
  };
}

/**
 * Auto-detect column mapping based on header names
 */
export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  const mapping: ColumnMapping = {
    name: null,
    description: null,
    price: null,
    images: null,
    category: null,
    is_digital: null,
    track_inventory: null,
    inventory_count: null,
  };

  // Name detection
  const namePatterns = ["name", "title", "product name", "product_name", "product title"];
  mapping.name = findColumnIndex(normalizedHeaders, namePatterns);

  // Description detection
  const descPatterns = ["description", "desc", "details", "product description", "body", "content"];
  mapping.description = findColumnIndex(normalizedHeaders, descPatterns);

  // Price detection
  const pricePatterns = ["price", "cost", "amount", "unit price", "unit_price"];
  mapping.price = findColumnIndex(normalizedHeaders, pricePatterns);

  // Images detection
  const imagePatterns = ["image", "images", "image url", "image_url", "photo", "photos", "picture", "pictures"];
  mapping.images = findColumnIndex(normalizedHeaders, imagePatterns);

  // Category detection
  const categoryPatterns = ["category", "type", "collection", "group", "product type"];
  mapping.category = findColumnIndex(normalizedHeaders, categoryPatterns);

  // Digital product detection
  const digitalPatterns = ["is_digital", "digital", "downloadable", "virtual"];
  mapping.is_digital = findColumnIndex(normalizedHeaders, digitalPatterns);

  // Track inventory detection
  const trackPatterns = ["track_inventory", "track inventory", "track stock"];
  mapping.track_inventory = findColumnIndex(normalizedHeaders, trackPatterns);

  // Inventory count detection
  const inventoryPatterns = ["inventory", "inventory_count", "stock", "quantity", "qty", "count"];
  mapping.inventory_count = findColumnIndex(normalizedHeaders, inventoryPatterns);

  return mapping;
}

function findColumnIndex(headers: string[], patterns: string[]): number | null {
  for (const pattern of patterns) {
    const index = headers.findIndex(h => h === pattern || h.includes(pattern));
    if (index !== -1) {
      return index;
    }
  }
  return null;
}

/**
 * Transform a CSV row into a product object using the column mapping
 */
export function transformRow(
  row: string[],
  mapping: ColumnMapping,
  rowIndex: number
): { product: ParsedProduct | null; errors: ImportError[] } {
  const errors: ImportError[] = [];

  // Get name (required)
  const name = mapping.name !== null ? row[mapping.name]?.trim() : "";
  if (!name) {
    errors.push({ row: rowIndex, field: "name", message: "Product name is required" });
  }

  // Get description
  const description = mapping.description !== null ? row[mapping.description]?.trim() || "" : "";

  // Get price and convert to smallest unit (cents for USD, whole units for JPY, etc.)
  let price = 0;
  if (mapping.price !== null) {
    const priceStr = row[mapping.price]?.trim() || "0";
    // Remove currency symbols and commas
    const cleanPrice = priceStr.replace(/[$,€£¥₩]/g, "");
    const parsedPrice = parseFloat(cleanPrice);
    if (isNaN(parsedPrice)) {
      errors.push({ row: rowIndex, field: "price", message: `Invalid price: "${priceStr}"` });
    } else {
      // Convert to smallest currency unit (handles zero-decimal currencies like JPY)
      price = toSmallestUnit(parsedPrice, getStoreCurrency());
    }
  }

  // Get images (comma-separated URLs)
  let images: string[] = [];
  if (mapping.images !== null) {
    const imagesStr = row[mapping.images]?.trim() || "";
    if (imagesStr) {
      images = imagesStr.split(",").map(url => url.trim()).filter(url => url);
      // Validate URLs
      images = images.filter(url => {
        try {
          new URL(url);
          return true;
        } catch {
          errors.push({ row: rowIndex, field: "images", message: `Invalid image URL: "${url}"` });
          return false;
        }
      });
    }
  }

  // Get category
  const category = mapping.category !== null ? row[mapping.category]?.trim() || "" : "";

  // Get is_digital
  let is_digital = false;
  if (mapping.is_digital !== null) {
    const digitalStr = row[mapping.is_digital]?.toLowerCase().trim() || "";
    is_digital = ["true", "yes", "1", "y"].includes(digitalStr);
  }

  // Get track_inventory
  let track_inventory = false;
  if (mapping.track_inventory !== null) {
    const trackStr = row[mapping.track_inventory]?.toLowerCase().trim() || "";
    track_inventory = ["true", "yes", "1", "y"].includes(trackStr);
  }

  // Get inventory_count
  let inventory_count: number | null = null;
  if (mapping.inventory_count !== null) {
    const countStr = row[mapping.inventory_count]?.trim() || "";
    if (countStr) {
      const parsed = parseInt(countStr, 10);
      if (isNaN(parsed)) {
        errors.push({ row: rowIndex, field: "inventory_count", message: `Invalid inventory count: "${countStr}"` });
      } else {
        inventory_count = parsed;
        // If inventory_count is set, assume track_inventory should be true
        if (!track_inventory && inventory_count !== null) {
          track_inventory = true;
        }
      }
    }
  }

  if (errors.length > 0 && !name) {
    return { product: null, errors };
  }

  return {
    product: {
      name,
      description,
      price,
      images,
      category,
      is_digital,
      track_inventory: is_digital ? false : track_inventory,
      inventory_count: is_digital ? null : inventory_count,
    },
    errors,
  };
}

/**
 * Validate the entire import and transform all rows
 */
export function validateAndTransform(
  rows: string[][],
  mapping: ColumnMapping
): { products: ParsedProduct[]; errors: ImportError[] } {
  const products: ParsedProduct[] = [];
  const allErrors: ImportError[] = [];

  // Check required mapping
  if (mapping.name === null) {
    allErrors.push({ row: 0, field: "mapping", message: "Name column is required" });
    return { products, errors: allErrors };
  }

  for (let i = 0; i < rows.length; i++) {
    const { product, errors } = transformRow(rows[i], mapping, i + 1); // +1 for human-readable row numbers
    allErrors.push(...errors);
    if (product) {
      products.push(product);
    }
  }

  return { products, errors: allErrors };
}
