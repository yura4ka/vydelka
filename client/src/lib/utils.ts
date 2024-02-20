import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CategoryNavigation } from "@/features/categories/categoriesApiSlice";
import i18next from "i18next";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const emailRegex =
  // eslint-disable-next-line no-control-regex
  /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

export const phoneRegex = /^\+[1-9]?[0-9]{7,14}$/;

export const passwordRegex = /^.{4,}$/;

export type WithId<T> = T & { id: string };

export function sortBySubcategories(
  a: CategoryNavigation,
  b: CategoryNavigation,
) {
  if (a.subcategories && b.subcategories) return 0;
  if (a.subcategories && !b.subcategories) return -1;
  return 1;
}

export function formatMoney(kop: number) {
  const uah = kop / 100;
  const locale = i18next.resolvedLanguage ?? "en";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "UAH",
    currencyDisplay: "narrowSymbol",
    // @ts-expect-error https://github.com/microsoft/TypeScript/issues/43336
    trailingZeroDisplay: "stripIfInteger",
  }).format(uah);
}

export const RESTRICTED_FILTERS = ["orderBy", "page"];

export const PRODUCTS_ORDER_BY = [
  "new",
  "rating",
  "cheap",
  "expensive",
] as const;
