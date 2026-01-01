/**
 * Shopify CSV Parser
 * Handles parsing and transformation of Shopify product export CSV files
 *
 * Shopify CSV format:
 * - One row per variant (multiple rows for products with variants)
 * - Rows grouped by Handle column
 * - First row for each Handle has full product info + first variant
 * - Subsequent rows have Handle + variant-specific columns only
 */

import { parseCSV, type CSVParseResult, type ImportError } from "./csv-parser";

// Shopify column indices
interface ShopifyColumnMapping {
  handle: number | null;
  title: number | null;
  bodyHtml: number | null;
  vendor: number | null;
  type: number | null;
  tags: number | null;
  published: number | null;
  option1Name: number | null;
  option1Value: number | null;
  option2Name: number | null;
  option2Value: number | null;
  option3Name: number | null;
  option3Value: number | null;
  variantSku: number | null;
  variantPrice: number | null;
  variantCompareAtPrice: number | null;
  variantInventoryQty: number | null;
  variantInventoryPolicy: number | null;
  variantRequiresShipping: number | null;
  imageSrc: number | null;
  imageAltText: number | null;
  status: number | null;
}

// Intermediate Shopify product representation
interface ShopifyVariant {
  option1Value: string;
  option2Value: string;
  option3Value: string;
  sku: string;
  price: number; // in cents
  compareAtPrice: number | null;
  inventoryQty: number;
  requiresShipping: boolean;
}

interface ShopifyProduct {
  handle: string;
  title: string;
  bodyHtml: string;
  vendor: string;
  type: string;
  tags: string[];
  published: boolean;
  status: string;
  option1Name: string;
  option2Name: string;
  option3Name: string;
  variants: ShopifyVariant[];
  images: string[];
}

// GoSovereign import format
export interface ImportVariant {
  name: string;
  sku: string;
  price_adjustment: number; // relative to base price, in cents
  inventory_count: number;
  track_inventory: boolean;
  options: Record<string, string>;
  is_active: boolean;
}

export interface ImportProduct {
  name: string;
  description: string;
  price: number; // base price in cents
  images: string[];
  category: string;
  is_digital: boolean;
  track_inventory: boolean;
  inventory_count: number | null;
  has_variants: boolean;
  variant_options: string[];
  variants: ImportVariant[];
}

/**
 * Detect if CSV is in Shopify format by checking for characteristic columns
 */
export function isShopifyFormat(headers: string[]): boolean {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Shopify CSVs must have these columns
  const requiredColumns = ["handle", "title"];
  const hasRequired = requiredColumns.every(col =>
    normalizedHeaders.some(h => h === col)
  );

  // And typically have these variant-related columns
  const shopifyColumns = [
    "option1 name",
    "option1 value",
    "variant price",
    "variant sku",
    "body (html)"
  ];

  const shopifyMatches = shopifyColumns.filter(col =>
    normalizedHeaders.some(h => h === col || h.replace(/\s+/g, " ") === col)
  ).length;

  // Need required columns + at least 2 Shopify-specific columns
  return hasRequired && shopifyMatches >= 2;
}

/**
 * Find column indices for Shopify columns
 */
function getShopifyColumnMapping(headers: string[]): ShopifyColumnMapping {
  const normalized = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, " "));

  const findColumn = (patterns: string[]): number | null => {
    for (const pattern of patterns) {
      const idx = normalized.findIndex(h => h === pattern);
      if (idx !== -1) return idx;
    }
    return null;
  };

  return {
    handle: findColumn(["handle"]),
    title: findColumn(["title"]),
    bodyHtml: findColumn(["body (html)", "body html", "description"]),
    vendor: findColumn(["vendor"]),
    type: findColumn(["type", "product type"]),
    tags: findColumn(["tags"]),
    published: findColumn(["published"]),
    option1Name: findColumn(["option1 name"]),
    option1Value: findColumn(["option1 value"]),
    option2Name: findColumn(["option2 name"]),
    option2Value: findColumn(["option2 value"]),
    option3Name: findColumn(["option3 name"]),
    option3Value: findColumn(["option3 value"]),
    variantSku: findColumn(["variant sku"]),
    variantPrice: findColumn(["variant price"]),
    variantCompareAtPrice: findColumn(["variant compare at price"]),
    variantInventoryQty: findColumn(["variant inventory qty"]),
    variantInventoryPolicy: findColumn(["variant inventory policy"]),
    variantRequiresShipping: findColumn(["variant requires shipping"]),
    imageSrc: findColumn(["image src"]),
    imageAltText: findColumn(["image alt text"]),
    status: findColumn(["status"]),
  };
}

/**
 * Parse price string to cents
 */
function parsePriceToCents(priceStr: string): number {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[$,]/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}

/**
 * Parse boolean from various string formats
 */
function parseBoolean(value: string): boolean {
  const lower = (value || "").toLowerCase().trim();
  return ["true", "yes", "1", "y", "active"].includes(lower);
}

/**
 * Get cell value safely
 */
function getCell(row: string[], index: number | null): string {
  if (index === null || index < 0 || index >= row.length) return "";
  return (row[index] || "").trim();
}

/**
 * Parse Shopify CSV rows into grouped products
 */
export function parseShopifyRows(
  rows: string[][],
  headers: string[]
): { products: ShopifyProduct[]; errors: ImportError[] } {
  const mapping = getShopifyColumnMapping(headers);
  const errors: ImportError[] = [];

  if (mapping.handle === null) {
    errors.push({ row: 0, field: "mapping", message: "Handle column is required for Shopify format" });
    return { products: [], errors };
  }

  if (mapping.title === null) {
    errors.push({ row: 0, field: "mapping", message: "Title column is required for Shopify format" });
    return { products: [], errors };
  }

  // Group rows by handle
  const productGroups = new Map<string, { rows: string[][]; indices: number[] }>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const handle = getCell(row, mapping.handle);

    if (!handle) {
      errors.push({ row: i + 2, field: "handle", message: "Missing handle" });
      continue;
    }

    if (!productGroups.has(handle)) {
      productGroups.set(handle, { rows: [], indices: [] });
    }
    productGroups.get(handle)!.rows.push(row);
    productGroups.get(handle)!.indices.push(i + 2); // +2 for 1-indexed and header row
  }

  // Convert groups to products
  const products: ShopifyProduct[] = [];

  for (const [handle, group] of Array.from(productGroups.entries())) {
    const firstRow = group.rows[0];
    const rowIndex = group.indices[0];

    // Extract product info from first row
    const title = getCell(firstRow, mapping.title);
    if (!title) {
      errors.push({ row: rowIndex, field: "title", message: "Missing product title" });
      continue;
    }

    const bodyHtml = getCell(firstRow, mapping.bodyHtml);
    const vendor = getCell(firstRow, mapping.vendor);
    const type = getCell(firstRow, mapping.type);
    const tagsStr = getCell(firstRow, mapping.tags);
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];
    const published = parseBoolean(getCell(firstRow, mapping.published));
    const status = getCell(firstRow, mapping.status) || (published ? "active" : "draft");

    // Get option names from first row
    const option1Name = getCell(firstRow, mapping.option1Name);
    const option2Name = getCell(firstRow, mapping.option2Name);
    const option3Name = getCell(firstRow, mapping.option3Name);

    // Collect all images and variants from all rows
    const images: string[] = [];
    const variants: ShopifyVariant[] = [];

    for (const row of group.rows) {
      // Collect image
      const imageSrc = getCell(row, mapping.imageSrc);
      if (imageSrc && !images.includes(imageSrc)) {
        images.push(imageSrc);
      }

      // Extract variant
      const option1Value = getCell(row, mapping.option1Value);
      const option2Value = getCell(row, mapping.option2Value);
      const option3Value = getCell(row, mapping.option3Value);
      const sku = getCell(row, mapping.variantSku);
      const priceStr = getCell(row, mapping.variantPrice);
      const compareAtPriceStr = getCell(row, mapping.variantCompareAtPrice);
      const inventoryQtyStr = getCell(row, mapping.variantInventoryQty);
      const requiresShippingStr = getCell(row, mapping.variantRequiresShipping);

      variants.push({
        option1Value,
        option2Value,
        option3Value,
        sku,
        price: parsePriceToCents(priceStr),
        compareAtPrice: compareAtPriceStr ? parsePriceToCents(compareAtPriceStr) : null,
        inventoryQty: parseInt(inventoryQtyStr) || 0,
        requiresShipping: parseBoolean(requiresShippingStr),
      });
    }

    products.push({
      handle,
      title,
      bodyHtml,
      vendor,
      type,
      tags,
      published,
      status,
      option1Name,
      option2Name,
      option3Name,
      variants,
      images,
    });
  }

  return { products, errors };
}

/**
 * Transform Shopify products to GoSovereign import format
 */
export function transformToImportProducts(
  shopifyProducts: ShopifyProduct[]
): ImportProduct[] {
  return shopifyProducts.map(sp => {
    // Determine if this product has real variants
    // A product has variants if:
    // 1. It has more than one variant row, OR
    // 2. It has option values defined
    const hasRealVariants = sp.variants.length > 1 ||
      (sp.variants.length === 1 && sp.variants[0].option1Value !== "");

    // Collect option names that are actually used
    const variantOptions: string[] = [];
    if (sp.option1Name && sp.variants.some(v => v.option1Value)) {
      variantOptions.push(sp.option1Name);
    }
    if (sp.option2Name && sp.variants.some(v => v.option2Value)) {
      variantOptions.push(sp.option2Name);
    }
    if (sp.option3Name && sp.variants.some(v => v.option3Value)) {
      variantOptions.push(sp.option3Name);
    }

    // Use first variant's price as base price
    const basePrice = sp.variants[0]?.price || 0;

    // Calculate total inventory
    const totalInventory = sp.variants.reduce((sum, v) => sum + v.inventoryQty, 0);

    // Transform variants
    const importVariants: ImportVariant[] = hasRealVariants
      ? sp.variants.map((v, idx) => {
          // Build variant name from option values
          const nameParts = [v.option1Value, v.option2Value, v.option3Value].filter(Boolean);
          const name = nameParts.join(" / ") || `Variant ${idx + 1}`;

          // Build options object
          const options: Record<string, string> = {};
          if (sp.option1Name && v.option1Value) {
            options[sp.option1Name] = v.option1Value;
          }
          if (sp.option2Name && v.option2Value) {
            options[sp.option2Name] = v.option2Value;
          }
          if (sp.option3Name && v.option3Value) {
            options[sp.option3Name] = v.option3Value;
          }

          return {
            name,
            sku: v.sku,
            price_adjustment: v.price - basePrice, // Relative to base price
            inventory_count: v.inventoryQty,
            track_inventory: true,
            options,
            is_active: true,
          };
        })
      : [];

    // Use Type or Vendor as category
    const category = sp.type || sp.vendor || "";

    return {
      name: sp.title,
      description: sp.bodyHtml, // Preserve HTML
      price: basePrice,
      images: sp.images,
      category,
      is_digital: !sp.variants.some(v => v.requiresShipping),
      track_inventory: hasRealVariants ? false : totalInventory > 0,
      inventory_count: hasRealVariants ? null : totalInventory,
      has_variants: hasRealVariants,
      variant_options: variantOptions,
      variants: importVariants,
    };
  });
}

/**
 * Main entry point: parse Shopify CSV content and return import-ready products
 */
export function parseShopifyCSV(content: string): {
  products: ImportProduct[];
  errors: ImportError[];
  productCount: number;
  variantCount: number;
} {
  const { headers, rows } = parseCSV(content);

  if (!isShopifyFormat(headers)) {
    return {
      products: [],
      errors: [{ row: 0, field: "format", message: "CSV does not appear to be in Shopify format" }],
      productCount: 0,
      variantCount: 0,
    };
  }

  const { products: shopifyProducts, errors } = parseShopifyRows(rows, headers);
  const importProducts = transformToImportProducts(shopifyProducts);

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
