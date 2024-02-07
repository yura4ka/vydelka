import { api } from "@/app/api/apiSlice";
import { Translation } from "../translations";

export type ProductImage = {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
};

export type ProductFilter = {
  id: string;
  slug: string;
  title: string;
};

export type ProductFilterVariant = {
  id: string;
  slug: string;
  variant: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  titleTranslations: Translation;
  descriptionTranslations: Translation;
  slug: string;
  price: number;
  filters: Map<string, ProductFilterVariant>;
  images: ProductImage[];
};

export type NewProduct = {
  title: Translation;
  description: Translation;
  slug: string;
  price: number;
  filters: string[];
  images: ProductImage[];
  categoryId: string;
};

export type ProductsRequest = {
  categoryId: string;
  withTranslations?: boolean;
};

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createProduct: builder.mutation<{ id: string }, NewProduct>({
      query: (body) => ({ url: `product`, method: "POST", body }),
    }),

    getProducts: builder.query<Product[], ProductsRequest>({
      query: (args) => ({
        url: `category/${args.categoryId}/products?withTranslations=${!!args.withTranslations}`,
      }),
      transformResponse: (
        response: (Product & { filters: [string, ProductFilterVariant][] })[],
      ) => response.map((r) => ({ ...r, filters: new Map(r.filters) })),
      providesTags: (result, _, args) =>
        result
          ? [
              ...result.map((p) => ({
                type: "Products" as const,
                id: p.id,
                categoryId: args.categoryId,
              })),
              { type: "Products", id: "LIST", categoryId: args.categoryId },
            ]
          : [{ type: "CategoryList", id: "LIST", categoryId: args.categoryId }],
    }),
  }),
});

export const { useCreateProductMutation, useGetProductsQuery } = productApi;
