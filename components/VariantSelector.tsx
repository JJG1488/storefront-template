"use client";

import { useState, useEffect, useCallback } from "react";

export interface VariantOption {
  name: string;
  values: string[];
}

export interface Variant {
  id: string;
  name: string;
  sku: string;
  price_adjustment: number;
  inventory_count: number;
  track_inventory: boolean;
  options: Record<string, string>;
  is_active: boolean;
}

interface Props {
  productId: string;
  basePrice: number;
  onVariantChange: (variant: Variant | null, finalPrice: number) => void;
}

export function VariantSelector({ productId, basePrice, onVariantChange }: Props) {
  const [options, setOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);

  const stableOnVariantChange = useCallback(onVariantChange, []);

  useEffect(() => {
    async function loadVariants() {
      try {
        const res = await fetch(`/api/products/${productId}/variants`);
        if (res.ok) {
          const data = await res.json();
          setHasVariants(data.hasVariants);
          setOptions(data.options || []);
          setVariants(data.variants || []);

          // Select the first variant by default if available
          if (data.variants && data.variants.length > 0) {
            const firstVariant = data.variants[0];
            setSelectedOptions(firstVariant.options);
            setSelectedVariant(firstVariant);
            stableOnVariantChange(firstVariant, basePrice + firstVariant.price_adjustment);
          }
        }
      } catch (error) {
        console.error("Failed to load variants:", error);
      } finally {
        setLoading(false);
      }
    }

    loadVariants();
  }, [productId, basePrice, stableOnVariantChange]);

  function handleOptionChange(optionName: string, value: string) {
    const newSelectedOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newSelectedOptions);

    // Find matching variant
    const matchingVariant = variants.find((v) =>
      Object.entries(newSelectedOptions).every(
        ([key, val]) => v.options[key] === val
      )
    );

    setSelectedVariant(matchingVariant || null);
    if (matchingVariant) {
      stableOnVariantChange(matchingVariant, basePrice + matchingVariant.price_adjustment);
    } else {
      stableOnVariantChange(null, basePrice);
    }
  }

  // Check if a specific option value is available given current selections
  function isOptionAvailable(optionName: string, value: string): boolean {
    const testOptions = { ...selectedOptions, [optionName]: value };

    return variants.some((v) => {
      // Check if variant matches the test options for all selected option types
      return Object.entries(testOptions).every(
        ([key, val]) => v.options[key] === val
      );
    });
  }

  // Check if a variant is in stock
  function isVariantInStock(variant: Variant): boolean {
    if (!variant.track_inventory) return true;
    return variant.inventory_count > 0;
  }

  if (loading) {
    return <div className="animate-pulse h-10 bg-gray-200 rounded" />;
  }

  if (!hasVariants || options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {options.map((option) => (
        <div key={option.name}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {option.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.name] === value;
              const isAvailable = isOptionAvailable(option.name, value);

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleOptionChange(option.name, value)}
                  disabled={!isAvailable}
                  className={`
                    px-4 py-2 border rounded-lg text-sm font-medium transition-all
                    ${
                      isSelected
                        ? "border-brand bg-brand text-white"
                        : isAvailable
                        ? "border-gray-300 bg-white hover:border-brand hover:text-brand"
                        : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    }
                  `}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Stock indicator for selected variant */}
      {selectedVariant && selectedVariant.track_inventory && (
        <div className="text-sm">
          {!isVariantInStock(selectedVariant) ? (
            <span className="text-red-600 font-medium">Out of stock</span>
          ) : selectedVariant.inventory_count <= 5 ? (
            <span className="text-orange-600 font-medium">
              Only {selectedVariant.inventory_count} left!
            </span>
          ) : null}
        </div>
      )}

      {/* SKU display */}
      {selectedVariant?.sku && (
        <p className="text-xs text-gray-500">SKU: {selectedVariant.sku}</p>
      )}
    </div>
  );
}
