import { api } from "@/app/api/apiSlice";
import { Translation } from "../translations";
import { WithId } from "@/lib/utils";

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
  categoryId?: string;
  withTranslations?: boolean;
  page?: number;
};

export type ProductsResponse = {
  products: Product[];
  hasMore: boolean;
  totalPages: number;
};

export type ProductsResponseNonTransformed = ProductsResponse & {
  products: (Product & { filters: [string, ProductFilterVariant][] })[];
};

export type ChangeProduct = WithId<Omit<NewProduct, "categoryId">>;

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createProduct: builder.mutation<{ id: string }, NewProduct>({
      query: (body) => ({ url: `product`, method: "POST", body }),
      invalidatesTags: (_result, _error, args) => [
        { type: "Products", categoryId: args.categoryId },
      ],
    }),

    getProducts: builder.query<ProductsResponse, ProductsRequest>({
      query: (args) => ({
        url: `product`,
        params: {
          withTranslations: args.withTranslations,
          page: args.page,
          categoryId: args.categoryId,
        },
      }),
      transformResponse: (response: ProductsResponseNonTransformed) => {
        const products = response.products.map((r) => ({
          ...r,
          filters: new Map(r.filters),
        }));
        return { ...response, products };
      },
      providesTags: (result, _, args) =>
        result
          ? [
              ...result.products.map((p) => ({
                type: "Products" as const,
                id: p.id,
                categoryId: args.categoryId,
              })),
              { type: "Products", id: "LIST", categoryId: args.categoryId },
            ]
          : [{ type: "Products", id: "LIST", categoryId: args.categoryId }],
    }),

    changeProduct: builder.mutation<undefined, ChangeProduct>({
      query: (body) => ({ url: `product`, method: "PUT", body }),
      invalidatesTags: (_result, _error, args) => [
        { type: "Products", id: args.id },
      ],
    }),

    deleteProduct: builder.mutation<undefined, string>({
      query: (id) => ({ url: `product/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, args) => [
        { type: "Products", id: args },
      ],
    }),
  }),
});

export const {
  useCreateProductMutation,
  useGetProductsQuery,
  useChangeProductMutation,
  useDeleteProductMutation,
} = productApi;
