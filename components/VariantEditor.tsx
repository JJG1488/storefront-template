"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, X, Trash2, GripVertical } from "lucide-react";

export interface VariantOption {
  name: string; // e.g., "Size", "Color"
  values: string[]; // e.g., ["S", "M", "L", "XL"]
}

export interface Variant {
  id?: string;
  name: string;
  sku: string;
  price_adjustment: number;
  inventory_count: number;
  track_inventory: boolean;
  options: Record<string, string>;
  position: number;
  is_active: boolean;
}

interface Props {
  productId: string;
  basePrice: number;
  hasVariants: boolean;
  variantOptions: VariantOption[];
  onVariantOptionsChange: (options: VariantOption[]) => void;
  onHasVariantsChange: (hasVariants: boolean) => void;
}

export function VariantEditor({
  productId,
  basePrice,
  hasVariants,
  variantOptions,
  onVariantOptionsChange,
  onHasVariantsChange,
}: Props) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionValues, setNewOptionValues] = useState("");

  // Load variants when component mounts and hasVariants is true
  useEffect(() => {
    if (hasVariants && productId) {
      loadVariants();
    }
  }, [hasVariants, productId]);

  async function loadVariants() {
    if (!productId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
      }
    } catch (error) {
      console.error("Failed to load variants:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveVariants() {
    if (!productId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ variants }),
      });
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
      }
    } catch (error) {
      console.error("Failed to save variants:", error);
    } finally {
      setSaving(false);
    }
  }

  function addOption() {
    if (!newOptionName.trim() || !newOptionValues.trim()) return;

    const values = newOptionValues
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    if (values.length === 0) return;

    const newOption: VariantOption = {
      name: newOptionName.trim(),
      values,
    };

    const updatedOptions = [...variantOptions, newOption];
    onVariantOptionsChange(updatedOptions);
    setNewOptionName("");
    setNewOptionValues("");

    // Generate variants from options
    generateVariantsFromOptions(updatedOptions);
  }

  function removeOption(index: number) {
    const updatedOptions = variantOptions.filter((_, i) => i !== index);
    onVariantOptionsChange(updatedOptions);
    generateVariantsFromOptions(updatedOptions);
  }

  function addValueToOption(optionIndex: number, value: string) {
    if (!value.trim()) return;

    const updatedOptions = variantOptions.map((opt, i) => {
      if (i === optionIndex && !opt.values.includes(value.trim())) {
        return { ...opt, values: [...opt.values, value.trim()] };
      }
      return opt;
    });
    onVariantOptionsChange(updatedOptions);
    generateVariantsFromOptions(updatedOptions);
  }

  function removeValueFromOption(optionIndex: number, valueIndex: number) {
    const updatedOptions = variantOptions.map((opt, i) => {
      if (i === optionIndex) {
        return { ...opt, values: opt.values.filter((_, vi) => vi !== valueIndex) };
      }
      return opt;
    });
    // Filter out options with no values
    const filteredOptions = updatedOptions.filter((opt) => opt.values.length > 0);
    onVariantOptionsChange(filteredOptions);
    generateVariantsFromOptions(filteredOptions);
  }

  // Memoize cartesian product calculation
  const cartesianProduct = useCallback((arrays: string[][]): string[][] => {
    if (arrays.length === 0) return [[]];
    if (arrays.length === 1) return arrays[0].map((v) => [v]);

    return arrays.reduce<string[][]>(
      (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
      [[]]
    );
  }, []);

  // Memoize variant generation to avoid expensive recalculations
  const generateVariantsFromOptions = useCallback((options: VariantOption[]) => {
    if (options.length === 0) {
      setVariants([]);
      return;
    }

    // Generate cartesian product of all option values
    const combinations = cartesianProduct(options.map((o) => o.values));

    // Create variants, preserving existing data where possible
    setVariants((prevVariants) => {
      const newVariants: Variant[] = combinations.map((combo, index) => {
        const optionsObj: Record<string, string> = {};
        options.forEach((opt, i) => {
          optionsObj[opt.name] = combo[i];
        });

        const variantName = combo.join(" / ");

        // Try to find existing variant with same options
        const existing = prevVariants.find(
          (v) => JSON.stringify(v.options) === JSON.stringify(optionsObj)
        );

        if (existing) {
          return { ...existing, position: index };
        }

        return {
          name: variantName,
          sku: "",
          price_adjustment: 0,
          inventory_count: 0,
          track_inventory: true,
          options: optionsObj,
          position: index,
          is_active: true,
        };
      });

      return newVariants;
    });
  }, [cartesianProduct]);

  function updateVariant(index: number, field: keyof Variant, value: unknown) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  function formatPrice(cents: number): string {
    const total = basePrice + cents;
    return `$${(total / 100).toFixed(2)}`;
  }

  return (
    <div className="border-t pt-6">
      <label className="flex items-center gap-3 mb-4">
        <input
          type="checkbox"
          checked={hasVariants}
          onChange={(e) => {
            onHasVariantsChange(e.target.checked);
            if (!e.target.checked) {
              setVariants([]);
              onVariantOptionsChange([]);
            }
          }}
          className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand"
        />
        <div>
          <span className="font-medium">This product has variants</span>
          <p className="text-sm text-gray-500">
            Add options like Size, Color, or Material
          </p>
        </div>
      </label>

      {hasVariants && (
        <div className="space-y-6 mt-4 p-4 bg-gray-50 rounded-lg">
          {/* Existing Options */}
          {variantOptions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Options</h3>
              {variantOptions.map((option, optIndex) => (
                <div
                  key={optIndex}
                  className="bg-white p-4 rounded-lg border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.name}</span>
                    <button
                      type="button"
                      onClick={() => removeOption(optIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value, valIndex) => (
                      <span
                        key={valIndex}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        {value}
                        <button
                          type="button"
                          onClick={() => removeValueFromOption(optIndex, valIndex)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <AddValueInput
                      onAdd={(value) => addValueToOption(optIndex, value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Option */}
          {variantOptions.length < 3 && (
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-3">Add Option</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Option Name
                  </label>
                  <input
                    type="text"
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    placeholder="e.g., Size"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Values (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newOptionValues}
                    onChange={(e) => setNewOptionValues(e.target.value)}
                    placeholder="e.g., S, M, L, XL"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addOption}
                disabled={!newOptionName.trim() || !newOptionValues.trim()}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Option
              </button>
            </div>
          )}

          {/* Variants Table */}
          {variants.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  Variants ({variants.length})
                </h3>
                <button
                  type="button"
                  onClick={saveVariants}
                  disabled={saving || !productId}
                  className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-hover active:bg-brand-active transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Variants"}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left font-medium text-gray-600">
                        Variant
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">
                        SKU
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">
                        Price Adj.
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">
                        Final Price
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">
                        Inventory
                      </th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600">
                        Active
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{variant.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) =>
                              updateVariant(index, "sku", e.target.value)
                            }
                            placeholder="SKU"
                            className="w-24 px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={(variant.price_adjustment / 100).toFixed(2)}
                              onChange={(e) =>
                                updateVariant(
                                  index,
                                  "price_adjustment",
                                  Math.round(parseFloat(e.target.value || "0") * 100)
                                )
                              }
                              className="w-20 px-2 py-1 border rounded text-sm"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {formatPrice(variant.price_adjustment)}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={variant.inventory_count}
                            onChange={(e) =>
                              updateVariant(
                                index,
                                "inventory_count",
                                parseInt(e.target.value || "0")
                              )
                            }
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={variant.is_active}
                            onChange={(e) =>
                              updateVariant(index, "is_active", e.target.checked)
                            }
                            className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loading && (
                <p className="text-sm text-gray-500 mt-2">Loading variants...</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Small component for adding values inline
function AddValueInput({ onAdd }: { onAdd: (value: string) => void }) {
  const [value, setValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="inline-flex items-center gap-1 px-3 py-1 border border-dashed rounded-full text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400"
      >
        <Plus className="w-3 h-3" />
        Add
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) {
          onAdd(value.trim());
          setValue("");
          setIsAdding(false);
        }
      }}
      className="inline-flex items-center gap-1"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        placeholder="Value"
        className="w-20 px-2 py-1 border rounded text-sm"
        onBlur={() => {
          if (!value.trim()) setIsAdding(false);
        }}
      />
      <button
        type="submit"
        className="p-1 text-brand hover:bg-brand/10 rounded"
      >
        <Plus className="w-4 h-4" />
      </button>
    </form>
  );
}
