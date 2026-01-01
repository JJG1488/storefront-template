"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing?: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const TOKEN_KEY = "customer_token";

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token and get customer info
  const verifyToken = useCallback(async (token: string): Promise<Customer | null> => {
    try {
      const res = await fetch("/api/customer/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        return data.customer;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        const customerData = await verifyToken(token);
        if (customerData) {
          setCustomer(customerData);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, [verifyToken]);

  // Login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/customer/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setCustomer(data.customer);
        return { success: true };
      }

      return { success: false, error: data.error || "Login failed" };
    } catch {
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  // Register
  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/customer/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (res.ok && responseData.token) {
        localStorage.setItem(TOKEN_KEY, responseData.token);
        setCustomer(responseData.customer);
        return { success: true };
      }

      return { success: false, error: responseData.error || "Registration failed" };
    } catch {
      return { success: false, error: "Registration failed. Please try again." };
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await fetch("/api/customer/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore errors, still clear local state
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setCustomer(null);
  };

  // Refresh customer data
  const refreshCustomer = async (): Promise<void> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const customerData = await verifyToken(token);
      if (customerData) {
        setCustomer(customerData);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setCustomer(null);
      }
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoading,
        isAuthenticated: !!customer,
        login,
        register,
        logout,
        refreshCustomer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}

// Helper hook to get the auth token for API calls
export function useCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
