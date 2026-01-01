"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, ArrowRight, AlertTriangle, CheckCircle, X, Loader2, ChevronDown } from "lucide-react";
import {
  parseCSV,
  detectColumnMapping,
  validateAndTransform,
  type CSVParseResult,
  type ColumnMapping,
  type ParsedProduct,
  type ImportError,
} from "@/lib/csv-parser";

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

const PRODUCT_FIELDS = [
  { key: "name", label: "Product Name", required: true },
  { key: "description", label: "Description", required: false },
  { key: "price", label: "Price", required: false },
  { key: "images", label: "Images (URLs)", required: false },
  { key: "category", label: "Category", required: false },
  { key: "is_digital", label: "Digital Product", required: false },
  { key: "track_inventory", label: "Track Inventory", required: false },
  { key: "inventory_count", label: "Inventory Count", required: false },
] as const;

export default function ImportProductsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<ImportStep>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [csvData, setCsvData] = useState<CSVParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  // Handle file upload
  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setError("Failed to read file.");
        return;
      }

      const parsed = parseCSV(content);
      if (parsed.headers.length === 0) {
        setError("CSV file is empty or invalid.");
        return;
      }

      setCsvData(parsed);
      const detectedMapping = detectColumnMapping(parsed.headers);
      setMapping(detectedMapping);
      setError("");
      setStep("mapping");
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Update column mapping
  const updateMapping = (field: keyof ColumnMapping, value: number | null) => {
    if (mapping) {
      setMapping({ ...mapping, [field]: value });
    }
  };

  // Proceed to preview
  const handlePreview = () => {
    if (!csvData || !mapping) return;

    const { products: parsed, errors } = validateAndTransform(csvData.rows, mapping);
    setProducts(parsed);
    setValidationErrors(errors);
    setStep("preview");
  };

  // Start import
  const handleImport = async () => {
    if (products.length === 0) return;

    setStep("importing");
    setImportProgress(0);

    const token = localStorage.getItem("admin_token");
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        const res = await fetch("/api/admin/products/import", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(product),
        });

        if (res.ok) {
          result.success++;
        } else {
          const data = await res.json();
          result.failed++;
          result.errors.push({
            row: i + 1,
            message: data.error || "Failed to import",
          });
        }
      } catch {
        result.failed++;
        result.errors.push({
          row: i + 1,
          message: "Network error",
        });
      }

      setImportProgress(Math.round(((i + 1) / products.length) * 100));
    }

    setImportResult(result);
    setStep("complete");
  };

  // Reset and start over
  const handleReset = () => {
    setCsvData(null);
    setMapping(null);
    setProducts([]);
    setValidationErrors([]);
    setImportProgress(0);
    setImportResult(null);
    setError("");
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Import Products</h1>
        <Link href="/admin/products" className="text-gray-600 hover:text-gray-900">
          &larr; Back to Products
        </Link>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl">
          {["Upload CSV", "Map Columns", "Preview", "Import"].map((label, idx) => {
            const stepOrder: ImportStep[] = ["upload", "mapping", "preview", "importing"];
            const currentIdx = stepOrder.indexOf(step === "complete" ? "importing" : step);
            const isActive = idx === currentIdx;
            const isComplete = idx < currentIdx || step === "complete";

            return (
              <div key={label} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isComplete
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-brand text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isComplete ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`ml-2 text-sm ${isActive ? "font-medium" : "text-gray-500"}`}>
                  {label}
                </span>
                {idx < 3 && <ArrowRight className="w-4 h-4 mx-4 text-gray-300" />}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-brand bg-brand/5"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag and drop your CSV file here
            </p>
            <p className="text-sm text-gray-500 mb-4">or click to select a file</p>
            <button
              type="button"
              className="px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90"
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Choose File
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">CSV Format Guide</h3>
            <p className="text-sm text-gray-600 mb-3">
              Your CSV should have headers in the first row. Supported columns:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>name</strong> (required) - Product name</li>
              <li><strong>description</strong> - Product description</li>
              <li><strong>price</strong> - Price in dollars (e.g., 29.99)</li>
              <li><strong>images</strong> - Comma-separated image URLs</li>
              <li><strong>category</strong> - Product category</li>
              <li><strong>inventory</strong> - Stock quantity</li>
              <li><strong>is_digital</strong> - true/false for digital products</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === "mapping" && csvData && mapping && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Map CSV Columns to Product Fields</h2>
          <p className="text-sm text-gray-600 mb-6">
            We detected {csvData.headers.length} columns and {csvData.rowCount} products.
            Verify the mapping below:
          </p>

          <div className="space-y-4 mb-6">
            {PRODUCT_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-4">
                <label className="w-40 text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="relative flex-1 max-w-xs">
                  <select
                    value={mapping[field.key as keyof ColumnMapping] ?? ""}
                    onChange={(e) =>
                      updateMapping(
                        field.key as keyof ColumnMapping,
                        e.target.value === "" ? null : parseInt(e.target.value)
                      )
                    }
                    className="w-full px-4 py-2 border rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    <option value="">-- Not Mapped --</option>
                    {csvData.headers.map((header, idx) => (
                      <option key={idx} value={idx}>
                        {header || `Column ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {mapping[field.key as keyof ColumnMapping] !== null && (
                  <span className="text-green-600">
                    <CheckCircle className="w-5 h-5" />
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Sample Data Preview */}
          <div className="border-t pt-6 mb-6">
            <h3 className="font-medium mb-3">Sample Data (First 3 rows)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {csvData.headers.map((header, idx) => (
                      <th key={idx} className="px-3 py-2 text-left font-medium text-gray-600">
                        {header || `Column ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {csvData.rows.slice(0, 3).map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-3 py-2 text-gray-700 max-w-xs truncate">
                          {cell || <span className="text-gray-400 italic">empty</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Start Over
            </button>
            <button
              onClick={handlePreview}
              disabled={mapping.name === null}
              className="px-6 py-2 bg-brand text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Preview Import <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Review Before Import</h2>

          {validationErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">
                    {validationErrors.length} warning(s) found
                  </p>
                  <ul className="text-sm text-amber-700 mt-2 space-y-1">
                    {validationErrors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li className="text-amber-600">
                        ... and {validationErrors.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-600">
              Ready to import <strong>{products.length}</strong> products.
            </p>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Price</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Images</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Inventory</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.slice(0, 10).map((product, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium">{product.name}</td>
                    <td className="px-4 py-2">${(product.price / 100).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      {product.images.length > 0 ? (
                        <span className="text-green-600">{product.images.length} URL(s)</span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {product.track_inventory ? product.inventory_count ?? 0 : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length > 10 && (
              <p className="text-sm text-gray-500 mt-2 px-4">
                ... and {products.length - 10} more products
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep("mapping")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back to Mapping
            </button>
            <button
              onClick={handleImport}
              className="px-6 py-2 bg-brand text-white rounded-lg hover:opacity-90"
            >
              Import {products.length} Products
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Importing */}
      {step === "importing" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto text-brand animate-spin mb-4" />
            <h2 className="text-lg font-semibold mb-2">Importing Products...</h2>
            <p className="text-gray-600 mb-6">
              Please wait while we import your products and download images.
            </p>

            <div className="max-w-md mx-auto">
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-brand h-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{importProgress}% complete</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Complete */}
      {step === "complete" && importResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            {importResult.failed === 0 ? (
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            ) : (
              <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
            )}

            <h2 className="text-xl font-semibold mb-2">Import Complete</h2>
            <p className="text-gray-600 mb-6">
              Successfully imported <strong>{importResult.success}</strong> products.
              {importResult.failed > 0 && (
                <span className="text-amber-600">
                  {" "}{importResult.failed} failed.
                </span>
              )}
            </p>

            {importResult.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left max-w-lg mx-auto">
                <h3 className="font-medium text-amber-800 mb-2">Import Errors:</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  {importResult.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li>... and {importResult.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Import More
              </button>
              <button
                onClick={() => router.push("/admin/products")}
                className="px-6 py-2 bg-brand text-white rounded-lg hover:opacity-90"
              >
                View Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
