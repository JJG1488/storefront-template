/**
 * WooCommerce CSV Parser
 * Handles parsing and transformation of WooCommerce product export CSV files
 *
 * WooCommerce CSV format:
 * - "Type" column indicates product type: "simple", "variable", "variation"
 * - Variable products have child "variation" rows linked by "Parent" column
 * - Attributes are in columns: "Attribute 1 name", "Attribute 1 value(s)", etc.
 * - Prices use "Regular price" and "Sale price" columns
 * - Images can be comma-separated URLs
 */

import { parseCSV, type ImportError } from "./csv-parser";
import type { ImportProduct, ImportVariant } from "./shopify-csv-parser";

// Re-export types for convenience
export type { ImportProduct, ImportVariant };

// WooCommerce column indices
interface WooCommerceColumnMapping {
  id: number | null;
  type: number | null;
  sku: number | null;
  name: number | null;
  published: number | null;
  shortDescription: number | null;
  description: number | null;
  regularPrice: number | null;
  salePrice: number | null;
  categories: number | null;
  tags: number | null;
  images: number | null;
  parent: number | null;
  inStock: number | null;
  stock: number | null;
  // Attribute columns (dynamic, up to 10)
  attributes: Array<{
    nameCol: number;
    valueCol: number;
    visibleCol: number | null;
  }>;
}

// Intermediate WooCommerce product representation
interface WooCommerceVariation {
  sku: string;
  regularPrice: number; // in cents
  salePrice: number | null;
  stock: number;
  inStock: boolean;
  attributes: Record<string, string>;
  images: string[];
}

interface WooCommerceProduct {
  id: string;
  type: "simple" | "variable" | "grouped" | "external";
  sku: string;
  name: string;
  published: boolean;
  shortDescription: string;
  description: string;
  regularPrice: number; // in cents
  salePrice: number | null;
  categories: string[];
  tags: string[];
  images: string[];
  inStock: boolean;
  stock: number;
  attributeNames: string[];
  attributeValues: Record<string, string[]>;
  variations: WooCommerceVariation[];
}

/**
 * Detect if CSV is in WooCommerce format by checking for characteristic columns
 */
export function isWooCommerceFormat(headers: string[]): boolean {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // WooCommerce CSVs typically have these columns
  const wooColumns = [
    "type",
    "sku",
    "name",
    "regular price",
    "parent",
    "in stock?",
    "attribute 1 name",
  ];

  const matches = wooColumns.filter(col =>
    normalizedHeaders.some(h => h === col || h.replace(/\s+/g, " ") === col)
  ).length;

  // Need at least 4 WooCommerce-specific columns
  return matches >= 4;
}

/**
 * Find column indices for WooCommerce columns
 */
function getWooCommerceColumnMapping(headers: string[]): WooCommerceColumnMapping {
  const normalized = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, " "));

  const findColumn = (patterns: string[]): number | null => {
    for (const pattern of patterns) {
      const idx = normalized.findIndex(h => h === pattern);
      if (idx !== -1) return idx;
    }
    return null;
  };

  // Find attribute columns (WooCommerce supports many attributes)
  const attributes: WooCommerceColumnMapping["attributes"] = [];
  for (let i = 1; i <= 10; i++) {
    const nameCol = findColumn([`attribute ${i} name`]);
    const valueCol = findColumn([`attribute ${i} value(s)`, `attribute ${i} values`]);
    const visibleCol = findColumn([`attribute ${i} visible`]);

    if (nameCol !== null && valueCol !== null) {
      attributes.push({ nameCol, valueCol, visibleCol });
    }
  }

  return {
    id: findColumn(["id"]),
    type: findColumn(["type"]),
    sku: findColumn(["sku"]),
    name: findColumn(["name"]),
    published: findColumn(["published"]),
    shortDescription: findColumn(["short description"]),
    description: findColumn(["description"]),
    regularPrice: findColumn(["regular price"]),
    salePrice: findColumn(["sale price"]),
    categories: findColumn(["categories"]),
    tags: findColumn(["tags"]),
    images: findColumn(["images"]),
    parent: findColumn(["parent"]),
    inStock: findColumn(["in stock?", "in stock"]),
    stock: findColumn(["stock"]),
    attributes,
  };
}

/**
 * Parse price string to cents
 */
function parsePriceToCents(priceStr: string): number {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[$,€£]/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}

/**
 * Parse boolean from various string formats
 */
function parseBoolean(value: string): boolean {
  const lower = (value || "").toLowerCase().trim();
  return ["1", "yes", "true", "y"].includes(lower);
}

/**
 * Get cell value safely
 */
function getCell(row: string[], index: number | null): string {
  if (index === null || index < 0 || index >= row.length) return "";
  return (row[index] || "").trim();
}

/**
 * Parse comma-separated image URLs
 */
function parseImages(imagesStr: string): string[] {
  if (!imagesStr) return [];
  return imagesStr
    .split(",")
    .map(url => url.trim())
    .filter(url => url.startsWith("http"));
}

/**
 * Parse WooCommerce categories (can be hierarchical with > separator)
 */
function parseCategories(categoriesStr: string): string[] {
  if (!categoriesStr) return [];
  // WooCommerce uses comma to separate categories, > for hierarchy
  // e.g., "Clothing > T-Shirts, Accessories"
  return categoriesStr
    .split(",")
    .map(cat => {
      // Take the last part of hierarchical category
      const parts = cat.split(">");
      return parts[parts.length - 1].trim();
    })
    .filter(Boolean);
}

/**
 * Parse WooCommerce CSV rows into grouped products
 */
export function parseWooCommerceRows(
  rows: string[][],
  headers: string[]
): { products: WooCommerceProduct[]; errors: ImportError[] } {
  const mapping = getWooCommerceColumnMapping(headers);
  const errors: ImportError[] = [];

  if (mapping.name === null) {
    errors.push({ row: 0, field: "mapping", message: "Name column is required for WooCommerce format" });
    return { products: [], errors };
  }

  // First pass: collect all products and variations
  const productMap = new Map<string, WooCommerceProduct>();
  const variationMap = new Map<string, WooCommerceVariation[]>(); // parent ID/SKU -> variations

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for 1-indexed and header row

    const type = getCell(row, mapping.type).toLowerCase() || "simple";
    const id = getCell(row, mapping.id);
    const sku = getCell(row, mapping.sku);
    const name = getCell(row, mapping.name);
    const parent = getCell(row, mapping.parent);

    if (type === "variation") {
      // This is a variation row - link to parent
      if (!parent) {
        errors.push({ row: rowNum, field: "parent", message: "Variation missing parent reference" });
        continue;
      }

      // Extract attributes for this variation
      const attributes: Record<string, string> = {};
      for (const attr of mapping.attributes) {
        const attrName = getCell(row, attr.nameCol);
        const attrValue = getCell(row, attr.valueCol);
        if (attrName && attrValue) {
          attributes[attrName] = attrValue;
        }
      }

      const variation: WooCommerceVariation = {
        sku,
        regularPrice: parsePriceToCents(getCell(row, mapping.regularPrice)),
        salePrice: getCell(row, mapping.salePrice) ? parsePriceToCents(getCell(row, mapping.salePrice)) : null,
        stock: parseInt(getCell(row, mapping.stock)) || 0,
        inStock: parseBoolean(getCell(row, mapping.inStock)),
        attributes,
        images: parseImages(getCell(row, mapping.images)),
      };

      // Store variation by parent reference (could be ID or SKU)
      const parentKey = parent;
      if (!variationMap.has(parentKey)) {
        variationMap.set(parentKey, []);
      }
      variationMap.get(parentKey)!.push(variation);
    } else if (type === "simple" || type === "variable" || type === "grouped" || type === "external") {
      // This is a main product row
      if (!name) {
        errors.push({ row: rowNum, field: "name", message: "Missing product name" });
        continue;
      }

      // Extract attribute names and possible values for variable products
      const attributeNames: string[] = [];
      const attributeValues: Record<string, string[]> = {};

      for (const attr of mapping.attributes) {
        const attrName = getCell(row, attr.nameCol);
        const attrValuesStr = getCell(row, attr.valueCol);
        if (attrName && attrValuesStr) {
          attributeNames.push(attrName);
          // WooCommerce uses pipe | to separate attribute values
          attributeValues[attrName] = attrValuesStr.split("|").map(v => v.trim()).filter(Boolean);
        }
      }

      const product: WooCommerceProduct = {
        id,
        type: type as WooCommerceProduct["type"],
        sku,
        name,
        published: parseBoolean(getCell(row, mapping.published)),
        shortDescription: getCell(row, mapping.shortDescription),
        description: getCell(row, mapping.description),
        regularPrice: parsePriceToCents(getCell(row, mapping.regularPrice)),
        salePrice: getCell(row, mapping.salePrice) ? parsePriceToCents(getCell(row, mapping.salePrice)) : null,
        categories: parseCategories(getCell(row, mapping.categories)),
        tags: getCell(row, mapping.tags).split(",").map(t => t.trim()).filter(Boolean),
        images: parseImages(getCell(row, mapping.images)),
        inStock: parseBoolean(getCell(row, mapping.inStock)),
        stock: parseInt(getCell(row, mapping.stock)) || 0,
        attributeNames,
        attributeValues,
        variations: [],
      };

      // Use ID or SKU as key for linking variations
      const productKey = id || sku || name;
      productMap.set(productKey, product);
    }
  }

  // Second pass: link variations to their parent products
  for (const [parentKey, variations] of Array.from(variationMap.entries())) {
    // Try to find parent by ID, then by SKU
    let parent = productMap.get(parentKey);

    if (!parent) {
      // Try finding by matching ID or SKU
      for (const [, product] of Array.from(productMap.entries())) {
        if (product.id === parentKey || product.sku === parentKey) {
          parent = product;
          break;
        }
      }
    }

    if (parent) {
      parent.variations = variations;
    } else {
      errors.push({
        row: 0,
        field: "parent",
        message: `Could not find parent product for ${variations.length} variation(s) with parent "${parentKey}"`,
      });
    }
  }

  return { products: Array.from(productMap.values()), errors };
}

/**
 * Transform WooCommerce products to GoSovereign import format
 */
export function transformToImportProducts(
  wooProducts: WooCommerceProduct[]
): ImportProduct[] {
  return wooProducts.map(wp => {
    // Determine if this product has real variants
    const hasRealVariants = wp.type === "variable" && wp.variations.length > 0;

    // Use sale price if available, otherwise regular price
    const basePrice = wp.salePrice || wp.regularPrice;

    // Calculate total inventory
    const totalInventory = hasRealVariants
      ? wp.variations.reduce((sum, v) => sum + v.stock, 0)
      : wp.stock;

    // Transform variations
    const importVariants: ImportVariant[] = hasRealVariants
      ? wp.variations.map((v, idx) => {
          // Build variant name from attribute values
          const nameParts = Object.values(v.attributes);
          const name = nameParts.join(" / ") || `Variant ${idx + 1}`;

          // Use variation's sale price if available, otherwise regular price
          const variantPrice = v.salePrice || v.regularPrice;

          return {
            name,
            sku: v.sku,
            price_adjustment: variantPrice - basePrice, // Relative to base price
            inventory_count: v.stock,
            track_inventory: true,
            options: v.attributes,
            is_active: v.inStock,
          };
        })
      : [];

    // Use first category or empty
    const category = wp.categories[0] || "";

    // Combine description with short description
    const description = [wp.description, wp.shortDescription]
      .filter(Boolean)
      .join("\n\n");

    // Collect all images (product + variation images)
    const allImages = [...wp.images];
    if (hasRealVariants) {
      for (const v of wp.variations) {
        for (const img of v.images) {
          if (!allImages.includes(img)) {
            allImages.push(img);
          }
        }
      }
    }

    return {
      name: wp.name,
      description,
      price: basePrice,
      images: allImages,
      category,
      is_digital: false, // WooCommerce digital products need special handling
      track_inventory: hasRealVariants ? false : wp.inStock,
      inventory_count: hasRealVariants ? null : totalInventory,
      has_variants: hasRealVariants,
      variant_options: wp.attributeNames,
      variants: importVariants,
    };
  });
}

/**
 * Main entry point: parse WooCommerce CSV content and return import-ready products
 */
export function parseWooCommerceCSV(content: string): {
  products: ImportProduct[];
  errors: ImportError[];
  productCount: number;
  variantCount: number;
} {
  const { headers, rows } = parseCSV(content);

  if (!isWooCommerceFormat(headers)) {
    return {
      products: [],
      errors: [{ row: 0, field: "format", message: "CSV does not appear to be in WooCommerce format" }],
      productCount: 0,
      variantCount: 0,
    };
  }

  const { products: wooProducts, errors } = parseWooCommerceRows(rows, headers);
  const importProducts = transformToImportProducts(wooProducts);

  const variantCount = importProducts.reduce(
    (sum, p) => sum + (p.has_variants ? p.variants.length : 0),
    0
  );

  return {
    products: importProducts,
    errors,
    productCount: importProducts.length,
    variantCount,
  };
}
