import { api } from "@/app/api/apiSlice";
import { Translation } from "../translations";
import { WithId } from "@/lib/utils";
import { BreadcrumbRoute } from "@/components/Breadcrumb";

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

export type Product<FilterType = string> = {
  id: string;
  title: string;
  description: string;
  titleTranslations: Translation;
  descriptionTranslations: Translation;
  slug: string;
  price: number;
  filters: Map<FilterType, ProductFilterVariant>;
  images: ProductImage[];
  rating: number;
  reviews: number;
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
  filters?: string;
  ids?: string[];
  search?: string;
};

export type ProductsResponse = {
  products: Product[];
  hasMore: boolean;
  totalPages: number;
  total: number;
};

export type ProductsResponseNonTransformed = ProductsResponse & {
  products: (Product & { filters: [string, ProductFilterVariant][] })[];
};

export type ChangeProduct = WithId<Omit<NewProduct, "categoryId">>;

export type ProductRoute = BreadcrumbRoute;

export type Review = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  content: string;
  rating: number;
  userId: string;
  userName: string;
  productId: string;
  isVerified: boolean;
};

export type ReviewResponse = {
  reviews: Review[];
  hasMore: boolean;
  totalPages: number;
};

export type ReviewsRequest = {
  productId: string;
  page: number;
};

export type NewReview = {
  content: string;
  rating: number;
  productId: string;
};

export type ChangeReview = NewReview & {
  reviewId: string;
  page: number;
};

export type DeleteReview = {
  productId: string;
  reviewId: string;
};

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
        url: `product?${args.filters ?? ""}`,
        params: {
          withTranslations: args.withTranslations,
          page: args.page,
          categoryId: args.categoryId,
          ids: args.ids?.join(","),
          q: args.search,
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

    getPopularProducts: builder.query<Product[], string | void>({
      query: (category) => ({ url: `product/popular`, params: { category } }),
      transformResponse: (
        response: ProductsResponseNonTransformed["products"],
      ) => response.map((p) => ({ ...p, filters: new Map() })),
      providesTags: (result, _, category) =>
        result
          ? [
              ...result.map((p) => ({
                type: "Products" as const,
                id: p.id,
                category,
              })),
              { type: "Products", id: "LIST", category },
            ]
          : [{ type: "Products", id: "LIST", category }],
    }),

    getProductBySlug: builder.query<
      Product & {
        filters: [ProductFilter, ProductFilterVariant][];
      },
      string
    >({
      query: (product) => ({ url: `product/${product}` }),
      providesTags: (_result, _error, id) => [{ type: "Products", id }],
    }),

    getProductRoute: builder.query<ProductRoute[], string>({
      query: (product) => ({ url: `product/${product}/route` }),
    }),

    getReviews: builder.query<ReviewResponse, ReviewsRequest>({
      query: (args) => ({
        url: `product/${args.productId}/reviews?page=${args.page}`,
      }),
      providesTags: (result, _, { productId }) =>
        result
          ? [
              ...result.reviews.map((r) => ({
                type: "Reviews" as const,
                id: r.id,
                productId,
              })),
              { type: "Reviews", id: "LIST", productId },
            ]
          : [{ type: "Reviews", id: "LIST", productId }],
    }),

    createReview: builder.mutation<string, NewReview>({
      query: (args) => ({
        url: `product/${args.productId}/reviews`,
        method: "POST",
        body: { content: args.content, rating: args.rating },
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Reviews", productId },
      ],
    }),

    changeReview: builder.mutation<void, ChangeReview>({
      query: (args) => ({
        url: `product/${args.productId}/reviews/${args.reviewId}`,
        method: "PUT",
        body: { content: args.content, rating: args.rating },
      }),
      onQueryStarted: (args, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          productApi.util.updateQueryData(
            "getReviews",
            { productId: args.productId, page: args.page },
            (draft) => {
              Object.assign(
                draft.reviews.find((r) => r.id === args.reviewId)!,
                {
                  content: args.content,
                  rating: args.rating,
                },
              );
            },
          ),
        );
        queryFulfilled.catch(() => patchResult.undo());
      },
    }),

    deleteReview: builder.mutation<void, DeleteReview>({
      query: (args) => ({
        url: `product/${args.productId}/reviews/${args.reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId, reviewId }) => [
        { type: "Reviews", id: reviewId, productId },
      ],
    }),
  }),
});

export const {
  useCreateProductMutation,
  useGetProductsQuery,
  useChangeProductMutation,
  useDeleteProductMutation,
  useGetPopularProductsQuery,
  useGetProductBySlugQuery,
  useGetProductRouteQuery,
  useGetReviewsQuery,
  useCreateReviewMutation,
  useChangeReviewMutation,
  useDeleteReviewMutation,
} = productApi;
