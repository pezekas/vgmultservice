"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type CartItem = {
  id: string;
  productSlug: string;
  productName: string;
  categoryName: string;
  quantity: number;
  unitPrice?: number;
  areaRate?: number;
  calculatedTotal?: number;
  surchargeAmount?: number;
  surchargeLabel?: string;
  material?: string;
  width?: number;
  height?: number;
  cut?: string;
  fileName?: string;
  selections?: Record<string, string>;
  details: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "vg-multiservice-cart-v1";
const EMPTY_ITEMS: CartItem[] = [];
const listeners = new Set<() => void>();
let cachedStorageValue = "";
let cachedItems: CartItem[] = [];

function getSnapshot() {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
  if (stored === cachedStorageValue) return cachedItems;
  cachedStorageValue = stored;
  try {
    const parsed = JSON.parse(stored) as unknown;
    cachedItems = Array.isArray(parsed) ? parsed as CartItem[] : [];
  } catch {
    cachedItems = [];
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return cachedItems;
}

function getServerSnapshot() { return EMPTY_ITEMS; }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}
function writeCart(items: CartItem[]) {
  const stored = JSON.stringify(items);
  window.localStorage.setItem(STORAGE_KEY, stored);
  cachedStorageValue = stored;
  cachedItems = items;
  listeners.forEach((listener) => listener());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<CartContextValue>(() => ({
    items,
    addItem: (item) => writeCart([...getSnapshot(), { ...item, id: crypto.randomUUID() }]),
    removeItem: (id) => writeCart(getSnapshot().filter((item) => item.id !== id)),
    clearCart: () => writeCart([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de CartProvider.");
  return context;
}

export function CartLink() {
  const { items } = useCart();
  const count = items.length;
  return <Link className="cart-nav-link" href="/#orcamento" aria-label={`Pedido, ${count} ${count === 1 ? "item" : "itens"}`}>
    <span aria-hidden="true">▢</span> Pedido <b>{count}</b>
  </Link>;
}
