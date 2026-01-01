/**
 * BigCommerce CSV Parser
 * Handles parsing and transformation of BigCommerce product export CSV files
 *
 * BigCommerce CSV format:
 * - "Item Type" column indicates row type: "Product", "SKU" (variant), "Rule"
 * - Product rows contain main product info
 * - SKU rows are variants, following their parent Product row sequentially
 * - Images use numbered columns: "Product Image File - 1", "Product Image File - 2", etc.
 * - Categories are semicolon-separated
 */

import { parseCSV, type ImportError } from "./csv-parser";
import type { ImportProduct, ImportVariant } from "./shopify-csv-parser";

// Re-export types for convenience
export type { ImportProduct, ImportVariant };

// BigCommerce column indices
interface BigCommerceColumnMapping {
  itemType: number | null;
  productId: number | null;
  productName: number | null;
  productType: number | null;
  sku: number | null;
  price: number | null;
  salePrice: number | null;
  costPrice: number | null;
  stockLevel: number | null;
  trackInventory: number | null;
  allowPurchase: number | null;
  productVisible: number | null;
  categories: number | null;
  description: number | null;
  brand: number | null;
  optionSet: number | null;
  weight: number | null;
  // Dynamic image columns (up to 10)
  images: number[];
}

// Intermediate BigCommerce product representation
interface BigCommerceVariant {
  sku: string;
  price: number; // in cents
  salePrice: number | null;
  stockLevel: number;
  optionValues: string; // From Product Name field for SKU rows
}

interface BigCommerceProduct {
  id: string;
  name: string;
  productType: "P" | "D"; // Physical or Digital
  sku: string;
  price: number; // in cents
  salePrice: number | null;
  stockLevel: number;
  trackInventory: boolean;
  allowPurchase: boolean;
  visible: boolean;
  categories: string[];
  description: string;
  brand: string;
  optionSet: string;
  images: string[];
  variants: BigCommerceVariant[];
}

/**
 * Detect if CSV is in BigCommerce format by checking for characteristic columns
 */
export function isBigCommerceFormat(headers: string[]): boolean {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // BigCommerce CSVs must have "item type" column - this is unique to BigCommerce
  const hasItemType = normalizedHeaders.some(h => h === "item type");
  if (!hasItemType) return false;

  // Check for other BigCommerce-specific columns
  const bigCommerceColumns = [
    "product name",
    "product code/sku",
    "sku",
    "product type",
    "track inventory",
    "product image file - 1",
    "allow purchases?",
    "allow purchases",
    "product visible?",
    "product visible",
    "option set",
  ];

  const matches = bigCommerceColumns.filter(col =>
    normalizedHeaders.some(h => h === col || h.replace(/[?]/g, "") === col)
  ).length;

  // Need "item type" + at least 3 other BigCommerce columns
  return matches >= 3;
}

/**
 * Find column indices for BigCommerce columns
 */
function getBigCommerceColumnMapping(headers: string[]): BigCommerceColumnMapping {
  const normalized = headers.map(h => h.toLowerCase().trim().replace(/[?]/g, ""));

  const findColumn = (patterns: string[]): number | null => {
    for (const pattern of patterns) {
      const idx = normalized.findIndex(h => h === pattern);
      if (idx !== -1) return idx;
    }
    return null;
  };

  // Find image columns (Product Image File - 1, Product Image File - 2, etc.)
  const images: number[] = [];
  for (let i = 1; i <= 10; i++) {
    const idx = findColumn([`product image file - ${i}`, `product image file ${i}`]);
    if (idx !== null) {
      images.push(idx);
    }
  }

  return {
    itemType: findColumn(["item type"]),
    productId: findColumn(["product id"]),
    productName: findColumn(["product name"]),
    productType: findColumn(["product type"]),
    sku: findColumn(["product code/sku", "sku"]),
    price: findColumn(["price"]),
    salePrice: findColumn(["sale price"]),
    costPrice: findColumn(["cost price"]),
    stockLevel: findColumn(["stock level", "current stock level"]),
    trackInventory: findColumn(["track inventory"]),
    allowPurchase: findColumn(["allow purchases", "allow purchases?"]),
    productVisible: findColumn(["product visible", "product visible?"]),
    categories: findColumn(["categories", "category"]),
    description: findColumn(["product description", "description"]),
    brand: findColumn(["brand name", "brand"]),
    optionSet: findColumn(["option set", "option set name"]),
    weight: findColumn(["product weight", "weight"]),
    images,
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
 * Parse boolean from BigCommerce's Y/N format
 */
function parseBoolean(value: string): boolean {
  const lower = (value || "").toLowerCase().trim();
  return ["y", "yes", "true", "1"].includes(lower);
}

/**
 * Get cell value safely
 */
function getCell(row: string[], index: number | null): string {
  if (index === null || index < 0 || index >= row.length) return "";
  return (row[index] || "").trim();
}

/**
 * Parse BigCommerce categories (semicolon-separated)
 */
function parseCategories(categoriesStr: string): string[] {
  if (!categoriesStr) return [];
  return categoriesStr
    .split(";")
    .map(cat => cat.trim())
    .filter(Boolean);
}

/**
 * Collect images from numbered columns
 */
function collectImages(row: string[], imageIndices: number[]): string[] {
  const images: string[] = [];
  for (const idx of imageIndices) {
    const img = getCell(row, idx);
    if (img && (img.startsWith("http") || img.includes("."))) {
      images.push(img);
    }
  }
  return images;
}

/**
 * Parse BigCommerce CSV rows into grouped products
 */
export function parseBigCommerceRows(
  rows: string[][],
  headers: string[]
): { products: BigCommerceProduct[]; errors: ImportError[] } {
  const mapping = getBigCommerceColumnMapping(headers);
  const errors: ImportError[] = [];

  if (mapping.itemType === null) {
    errors.push({ row: 0, field: "mapping", message: "Item Type column is required for BigCommerce format" });
    return { products: [], errors };
  }

  if (mapping.productName === null) {
    errors.push({ row: 0, field: "mapping", message: "Product Name column is required for BigCommerce format" });
    return { products: [], errors };
  }

  const products: BigCommerceProduct[] = [];
  let currentProduct: BigCommerceProduct | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for 1-indexed and header row

    const itemType = getCell(row, mapping.itemType).toLowerCase();

    if (itemType === "product") {
      // This is a main product row
      const name = getCell(row, mapping.productName);
      if (!name) {
        errors.push({ row: rowNum, field: "name", message: "Missing product name" });
        continue;
      }

      const productTypeRaw = getCell(row, mapping.productType).toUpperCase();
      const productType: "P" | "D" = productTypeRaw === "D" ? "D" : "P";

      const trackInventoryStr = getCell(row, mapping.trackInventory).toLowerCase();
      const trackInventory = trackInventoryStr === "by product" || trackInventoryStr === "by option" || parseBoolean(trackInventoryStr);

      currentProduct = {
        id: getCell(row, mapping.productId),
        name,
        productType,
        sku: getCell(row, mapping.sku),
        price: parsePriceToCents(getCell(row, mapping.price)),
        salePrice: getCell(row, mapping.salePrice) ? parsePriceToCents(getCell(row, mapping.salePrice)) : null,
        stockLevel: parseInt(getCell(row, mapping.stockLevel)) || 0,
        trackInventory,
        allowPurchase: parseBoolean(getCell(row, mapping.allowPurchase) || "Y"),
        visible: parseBoolean(getCell(row, mapping.productVisible) || "Y"),
        categories: parseCategories(getCell(row, mapping.categories)),
        description: getCell(row, mapping.description),
        brand: getCell(row, mapping.brand),
        optionSet: getCell(row, mapping.optionSet),
        images: collectImages(row, mapping.images),
        variants: [],
      };

      products.push(currentProduct);
    } else if (itemType === "sku" && currentProduct) {
      // This is a variant row - add to current product
      const variant: BigCommerceVariant = {
        sku: getCell(row, mapping.sku),
        price: parsePriceToCents(getCell(row, mapping.price)),
        salePrice: getCell(row, mapping.salePrice) ? parsePriceToCents(getCell(row, mapping.salePrice)) : null,
        stockLevel: parseInt(getCell(row, mapping.stockLevel)) || 0,
        // In BigCommerce SKU rows, the Product Name field contains option values
        // e.g., "[Size=Small]" or "Size: Small, Color: Red"
        optionValues: getCell(row, mapping.productName),
      };

      // Collect variant images
      const variantImages = collectImages(row, mapping.images);
      for (const img of variantImages) {
        if (!currentProduct.images.includes(img)) {
          currentProduct.images.push(img);
        }
      }

      currentProduct.variants.push(variant);
    }
    // Skip "Rule" rows - they're for option rules, not products
  }

  return { products, errors };
}

/**
 * Parse variant option values from BigCommerce's format
 * Examples: "[Size=Small]", "Size: Small, Color: Red", "[S][Blue]"
 */
function parseOptionValues(optionStr: string): Record<string, string> {
  const options: Record<string, string> = {};

  if (!optionStr) return options;

  // Try format: [Name=Value] or [Name=Value][Name2=Value2]
  const bracketMatches = optionStr.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    for (const match of bracketMatches) {
      const inner = match.slice(1, -1); // Remove brackets
      const eqIdx = inner.indexOf("=");
      if (eqIdx > 0) {
        const name = inner.slice(0, eqIdx).trim();
        const value = inner.slice(eqIdx + 1).trim();
        options[name] = value;
      } else {
        // Just a value like [Small], use generic name
        options[`Option ${Object.keys(options).length + 1}`] = inner.trim();
      }
    }
    return options;
  }

  // Try format: Name: Value, Name2: Value2
  const colonParts = optionStr.split(",");
  for (const part of colonParts) {
    const colonIdx = part.indexOf(":");
    if (colonIdx > 0) {
      const name = part.slice(0, colonIdx).trim();
      const value = part.slice(colonIdx + 1).trim();
      options[name] = value;
    }
  }

  // If no parsing worked, use the whole string as a single option
  if (Object.keys(options).length === 0 && optionStr.trim()) {
    options["Option"] = optionStr.trim();
  }

  return options;
}

/**
 * Transform BigCommerce products to GoSovereign import format
 */
export function transformToImportProducts(
  bcProducts: BigCommerceProduct[]
): ImportProduct[] {
  return bcProducts.map(bp => {
    // Determine if this product has real variants
    const hasRealVariants = bp.variants.length > 0;

    // Use sale price if available, otherwise regular price
    const basePrice = bp.salePrice || bp.price;

    // Calculate total inventory
    const totalInventory = hasRealVariants
      ? bp.variants.reduce((sum, v) => sum + v.stockLevel, 0)
      : bp.stockLevel;

    // Collect all variant option names
    const allOptionNames = new Set<string>();
    const importVariants: ImportVariant[] = [];

    if (hasRealVariants) {
      for (let idx = 0; idx < bp.variants.length; idx++) {
        const v = bp.variants[idx];
        const options = parseOptionValues(v.optionValues);

        // Collect option names
        for (const key of Object.keys(options)) {
          allOptionNames.add(key);
        }

        // Build variant name from option values
        const nameParts = Object.values(options);
        const name = nameParts.length > 0 ? nameParts.join(" / ") : `Variant ${idx + 1}`;

        // Use variant's sale price if available, otherwise regular price
        const variantPrice = v.salePrice || v.price;

        importVariants.push({
          name,
          sku: v.sku,
          price_adjustment: variantPrice - basePrice, // Relative to base price
          inventory_count: v.stockLevel,
          track_inventory: true,
          options,
          is_active: true,
        });
      }
    }

    // Use first category or brand as category
    const category = bp.categories[0] || bp.brand || "";

    return {
      name: bp.name,
      description: bp.description,
      price: basePrice,
      images: bp.images,
      category,
      is_digital: bp.productType === "D",
      track_inventory: hasRealVariants ? false : bp.trackInventory,
      inventory_count: hasRealVariants ? null : totalInventory,
      has_variants: hasRealVariants,
      variant_options: Array.from(allOptionNames),
      variants: importVariants,
    };
  });
}

/**
 * Main entry point: parse BigCommerce CSV content and return import-ready products
 */
export function parseBigCommerceCSV(content: string): {
  products: ImportProduct[];
  errors: ImportError[];
  productCount: number;
  variantCount: number;
} {
  const { headers, rows } = parseCSV(content);

  if (!isBigCommerceFormat(headers)) {
    return {
      products: [],
      errors: [{ row: 0, field: "format", message: "CSV does not appear to be in BigCommerce format" }],
      productCount: 0,
      variantCount: 0,
    };
  }

  const { products: bcProducts, errors } = parseBigCommerceRows(rows, headers);
  const importProducts = transformToImportProducts(bcProducts);

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
