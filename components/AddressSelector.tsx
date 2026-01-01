"use client";

import { useState, useEffect } from "react";
import { MapPin, Check, Plus } from "lucide-react";

interface Address {
  id: string;
  label: string | null;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default_shipping: boolean;
}

interface AddressSelectorProps {
  selectedAddressId: string | null;
  onSelect: (addressId: string | null) => void;
}

export function AddressSelector({
  selectedAddressId,
  onSelect,
}: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/customer/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const fetchedAddresses = data.addresses || [];
        setAddresses(fetchedAddresses);

        // Auto-select default shipping address on first load
        if (!hasInitialized && fetchedAddresses.length > 0) {
          const defaultAddr = fetchedAddresses.find(
            (a: Address) => a.is_default_shipping
          );
          if (defaultAddr) {
            onSelect(defaultAddr.id);
          } else {
            // If no default, select the first address
            onSelect(fetchedAddresses[0].id);
          }
          setHasInitialized(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Ship to</h3>
        <div className="animate-pulse bg-gray-200 rounded-lg h-20" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return null; // Don't show selector if no saved addresses
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Ship to</h3>

      {/* Saved Addresses */}
      <div className="space-y-2">
        {addresses.map((address) => (
          <button
            key={address.id}
            type="button"
            onClick={() => onSelect(address.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
              selectedAddressId === address.id
                ? "border-brand bg-brand/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 ${
                  selectedAddressId === address.id
                    ? "text-brand"
                    : "text-gray-400"
                }`}
              >
                {selectedAddressId === address.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">
                    {address.first_name} {address.last_name}
                  </span>
                  {address.label && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {address.label}
                    </span>
                  )}
                  {address.is_default_shipping && (
                    <span className="text-xs px-2 py-0.5 bg-brand/10 text-brand rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {address.address_line1}
                  {address.address_line2 && `, ${address.address_line2}`}
                </p>
                <p className="text-sm text-gray-600">
                  {address.city}
                  {address.state && `, ${address.state}`} {address.postal_code}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Enter New Address Option */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
          selectedAddressId === null
            ? "border-brand bg-brand/5"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`${
              selectedAddressId === null ? "text-brand" : "text-gray-400"
            }`}
          >
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-medium text-gray-700">
            Enter a new address
          </span>
        </div>
      </button>
    </div>
  );
}
