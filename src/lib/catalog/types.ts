export type CatalogCategory = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type CatalogProduct = {
  id?: string;
  name: string;
  slug: string;
  category: CatalogCategory;
  shortDescription: string;
  description: string;
  pricingMode: "manual" | "per_area_m2" | "per_unit" | "fixed" | "per_linear_m";
  requiresMeasurements: boolean;
  measurementUnit: string | null;
  requiresFile: boolean;
  allowedFileExtensions: string[];
  imageUrl?: string;
  imageAlt?: string;
  additionalImages?: Array<{ imageUrl: string; imageAlt?: string }>;
  options?: Array<{ name: string; type?: "text" | "select"; isRequired: boolean; choices: string[]; surchargeChoice?: string; surchargeAmount?: number; surchargeMode?: "per_order" | "per_unit"; surchargeLabel?: string }>;
  priceRules: Array<{ optionValue: string; unitPrice: number; minimumPrice: number | null }>;
};
