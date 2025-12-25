"use client";

import { useState } from "react";
import { Check } from "lucide-react";

// Variant option structure
export interface VariantOption {
  name: string; // e.g., "Size", "Color"
  values: string[]; // e.g., ["S", "M", "L"] or ["Red", "Blue", "Green"]
}

// Full variant with price/stock
export interface ProductVariant {
  id: string;
  sku?: string;
  price: number; // in cents
  inventory?: number | null;
  options: Record<string, string>; // e.g., { Size: "M", Color: "Red" }
}

interface VariantSelectorProps {
  options: VariantOption[];
  variants?: ProductVariant[];
  selectedOptions: Record<string, string>;
  onOptionChange: (optionName: string, value: string) => void;
  disabled?: boolean;
}

// Common color name to hex mapping
const colorMap: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  purple: "#a855f7",
  pink: "#ec4899",
  orange: "#f97316",
  black: "#000000",
  white: "#ffffff",
  gray: "#6b7280",
  grey: "#6b7280",
  brown: "#92400e",
  navy: "#1e3a5a",
  teal: "#14b8a6",
  gold: "#d4af37",
  silver: "#c0c0c0",
  beige: "#f5f5dc",
  cream: "#fffdd0",
  coral: "#ff7f50",
  mint: "#98ff98",
  lavender: "#e6e6fa",
  burgundy: "#800020",
  olive: "#808000",
  tan: "#d2b48c",
  khaki: "#c3b091",
  maroon: "#800000",
  charcoal: "#36454f",
};

function getColorHex(colorName: string): string | null {
  const normalized = colorName.toLowerCase().trim();

  // Check if it's already a hex color
  if (normalized.startsWith("#")) {
    return normalized;
  }

  return colorMap[normalized] || null;
}

function isColorOption(optionName: string): boolean {
  const colorTerms = ["color", "colour", "shade", "finish"];
  return colorTerms.some((term) =>
    optionName.toLowerCase().includes(term)
  );
}

export function VariantSelector({
  options,
  variants,
  selectedOptions,
  onOptionChange,
  disabled = false,
}: VariantSelectorProps) {
  // Check if a specific option value is available (has stock)
  const isValueAvailable = (optionName: string, value: string): boolean => {
    if (!variants) return true; // If no variants defined, all are available

    // Check if any variant with this option value has stock
    return variants.some((variant) => {
      if (variant.options[optionName] !== value) return false;

      // Check if other selected options match
      const otherOptionsMatch = Object.entries(selectedOptions).every(
        ([key, val]) => key === optionName || variant.options[key] === val || !val
      );

      if (!otherOptionsMatch) return false;

      // Check stock
      if (variant.inventory === null || variant.inventory === undefined) return true;
      return variant.inventory > 0;
    });
  };

  return (
    <div className="space-y-6">
      {options.map((option) => {
        const isColor = isColorOption(option.name);

        return (
          <div key={option.name}>
            <div className="flex items-center justify-between mb-3">
              <label className="font-medium text-gray-900">
                {option.name}
                {selectedOptions[option.name] && (
                  <span className="text-gray-500 font-normal ml-2">
                    : {selectedOptions[option.name]}
                  </span>
                )}
              </label>
              {option.values.length > 4 && (
                <span className="text-sm text-gray-500">
                  {option.values.length} options
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isSelected = selectedOptions[option.name] === value;
                const isAvailable = isValueAvailable(option.name, value);
                const colorHex = isColor ? getColorHex(value) : null;

                if (isColor && colorHex) {
                  // Color swatch button
                  return (
                    <button
                      key={value}
                      onClick={() => onOptionChange(option.name, value)}
                      disabled={disabled || !isAvailable}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                        isSelected
                          ? "border-brand ring-2 ring-brand/20"
                          : "border-gray-200 hover:border-gray-300"
                      } ${!isAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                      style={{ backgroundColor: colorHex }}
                      aria-label={`Select ${value}`}
                      title={value}
                    >
                      {isSelected && (
                        <span
                          className={`absolute inset-0 flex items-center justify-center ${
                            colorHex === "#ffffff" || colorHex === "#fffdd0"
                              ? "text-gray-800"
                              : "text-white"
                          }`}
                        >
                          <Check className="w-5 h-5" />
                        </span>
                      )}
                      {!isAvailable && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-gray-400 rotate-45 absolute" />
                        </span>
                      )}
                    </button>
                  );
                }

                // Text/size button
                return (
                  <button
                    key={value}
                    onClick={() => onOptionChange(option.name, value)}
                    disabled={disabled || !isAvailable}
                    className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                      isSelected
                        ? "border-brand bg-brand text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white"
                    } ${
                      !isAvailable
                        ? "opacity-40 cursor-not-allowed line-through"
                        : ""
                    }`}
                    aria-label={`Select ${option.name}: ${value}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Quantity selector component
interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  max?: number;
  min?: number;
  disabled?: boolean;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  max = 99,
  min = 1,
  disabled = false,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= min && value <= max) {
      onQuantityChange(value);
    }
  };

  return (
    <div className="flex items-center">
      <label className="font-medium text-gray-900 mr-4">Quantity</label>
      <div className="flex items-center border border-gray-200 rounded-lg">
        <button
          onClick={handleDecrement}
          disabled={disabled || quantity <= min}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease quantity"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>
        <input
          type="number"
          value={quantity}
          onChange={handleInputChange}
          min={min}
          max={max}
          disabled={disabled}
          className="w-12 h-10 text-center border-x border-gray-200 text-gray-900 font-medium focus:outline-none disabled:opacity-40"
        />
        <button
          onClick={handleIncrement}
          disabled={disabled || quantity >= max}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase quantity"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
      {max < 99 && (
        <span className="ml-3 text-sm text-gray-500">{max} available</span>
      )}
    </div>
  );
}
