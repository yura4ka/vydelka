import { api } from "@/app/api/apiSlice";
import { Language, Translation } from "../translations";
import i18next from "i18next";
import { WithId } from "@/lib/utils";

export type Category = {
  id: string;
  createdAt: string;
  title: string;
  slug: string;
  parentId?: string;
  imageUrl: string;
};

export type NewCategory = {
  title: Translation;
  slug: string;
  parentId?: string;
  imageUrl: string;
};

export type CategoryInfo = Category & {
  title: Translation;
};

export type ChangeCategory = WithId<NewCategory>;

export type Filter = {
  id: string;
  title: string;
  translations: Translation;
  slug: string;
  variants: {
    id: string;
    variant: string;
    translations: Translation;
    slug: string;
  }[];
};

export type NewFilter = {
  categoryId: string;
  filter: { title: Translation; slug: string };
};

export type NewFilterVariant = {
  categoryId: string;
  filterId: string;
  variant: { variant: Translation; slug: string };
};

export type ChangeFilter = NewFilter & { filter: WithId<NewFilter["filter"]> };

export type ChangeFilterVariant = NewFilterVariant & {
  variant: WithId<NewFilterVariant["variant"]>;
};

export type DeleteFilter = WithId<Omit<NewFilter, "filter">>;

export type DeleteFilterVariant = WithId<Omit<NewFilterVariant, "variant">>;

export type CategoryNavigation = Category & {
  subcategories?: CategoryNavigation[];
};

export const categoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], string | void>({
      query: (id) => ({ url: id ? `category?parentId=${id}` : `category` }),
      providesTags: (result, _, id) =>
        result
          ? [
              ...result.map((c) => ({
                type: "CategoryList" as const,
                id: c.id,
                categoryId: id,
              })),
              { type: "CategoryList", categoryId: id },
            ]
          : [{ type: "CategoryList", categoryId: id }],
    }),

    createCategory: builder.mutation<{ id: string }, NewCategory>({
      query: (body) => ({ url: `category`, method: "POST", body }),
      invalidatesTags: ["CategoryNavigation"],
      onQueryStarted: async (category, { dispatch, queryFulfilled }) => {
        const lang = i18next.resolvedLanguage as Language;
        const result = await queryFulfilled;
        dispatch(
          categoryApi.util.updateQueryData(
            "getCategories",
            category.parentId,
            (draft) => {
              draft.splice(0, 0, {
                ...category,
                id: result.data.id,
                title: category.title[lang],
                createdAt: new Date().toString(),
              });
            },
          ),
        );
      },
    }),

    getCategoryById: builder.query<CategoryInfo, string>({
      query: (id) => ({ url: `category/${id}` }),
      providesTags: (_result, _err, id) => [{ type: "CategoryInfo", id }],
    }),

    changeCategory: builder.mutation<undefined, ChangeCategory>({
      query: (body) => ({ url: `category`, method: "PUT", body }),
      invalidatesTags: (_result, _error, category) => [
        { type: "CategoryList", id: category.id },
        "CategoryNavigation",
      ],
      onQueryStarted: async (category, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          categoryApi.util.updateQueryData(
            "getCategoryById",
            category.id,
            (draft) => {
              Object.assign(draft, category);
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    getFilters: builder.query<
      Filter[],
      { categoryId: string; withTranslations?: boolean }
    >({
      query: (args) => ({
        url: `category/${args.categoryId}/filters?withTranslations=${!!args.withTranslations}`,
      }),
      providesTags: (_result, _error, { categoryId }) => [
        { type: "CategoryFilters", categoryId },
      ],
    }),

    createFilter: builder.mutation<{ id: string }, NewFilter>({
      query: ({ categoryId, filter }) => ({
        url: `category/${categoryId}/filters`,
        method: "POST",
        body: filter,
      }),
      onQueryStarted: async (
        { categoryId, filter },
        { dispatch, queryFulfilled },
      ) => {
        const result = await queryFulfilled;
        dispatch(
          categoryApi.util.updateQueryData(
            "getFilters",
            { categoryId, withTranslations: true },
            (draft) => {
              draft.splice(0, 0, {
                id: result.data.id,
                slug: filter.slug,
                title: "",
                translations: filter.title,
                variants: [],
              });
            },
          ),
        );
      },
    }),

    createFilterVariant: builder.mutation<{ id: string }, NewFilterVariant>({
      query: (args) => ({
        url: `category/${args.categoryId}/filters/${args.filterId}/variants`,
        method: "POST",
        body: args.variant,
      }),
      onQueryStarted: async (
        { categoryId, filterId, variant },
        { dispatch, queryFulfilled },
      ) => {
        const result = await queryFulfilled;
        dispatch(
          categoryApi.util.updateQueryData(
            "getFilters",
            { categoryId, withTranslations: true },
            (draft) => {
              draft
                .find((f) => f.id === filterId)
                ?.variants.splice(Infinity, 0, {
                  id: result.data.id,
                  slug: variant.slug,
                  variant: "",
                  translations: variant.variant,
                });
            },
          ),
        );
      },
    }),

    changeFilter: builder.mutation<undefined, ChangeFilter>({
      query: (args) => ({
        url: `category/${args.categoryId}/filters`,
        method: "PUT",
        body: args.filter,
      }),
      onQueryStarted: async (
        { categoryId, filter },
        { dispatch, queryFulfilled },
      ) => {
        const patchResult = dispatch(
          categoryApi.util.updateQueryData(
            "getFilters",
            {
              categoryId: categoryId,
              withTranslations: true,
            },
            (draft) => {
              Object.assign(draft.find((f) => f.id === filter.id)!, {
                translations: filter.title,
                slug: filter.slug,
              });
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    changeFilterVariant: builder.mutation<undefined, ChangeFilterVariant>({
      query: (args) => ({
        url: `category/${args.categoryId}/filters/${args.filterId}/variants`,
        method: "PUT",
        body: args.variant,
      }),
      onQueryStarted: async (
        { categoryId, filterId, variant },
        { dispatch, queryFulfilled },
      ) => {
        const patchResult = dispatch(
          categoryApi.util.updateQueryData(
            "getFilters",
            { categoryId, withTranslations: true },
            (draft) => {
              Object.assign(
                draft
                  .find((f) => f.id === filterId)!
                  .variants.find((v) => v.id === variant.id)!,
                {
                  translations: variant.variant,
                  slug: variant.slug,
                },
              );
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    deleteFilter: builder.mutation<undefined, DeleteFilter>({
      query: (args) => ({
        url: `category/${args.categoryId}/filters/${args.id}`,
        method: "DELETE",
      }),
      onQueryStarted: async (
        { categoryId, id },
        { dispatch, queryFulfilled },
      ) => {
        const patchResult = dispatch(
          categoryApi.util.updateQueryData(
            "getFilters",
            { categoryId, withTranslations: true },
            (draft) => draft.filter((f) => f.id !== id),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    deleteFilterVariant: builder.mutation<undefined, DeleteFilterVariant>({
      query: (args) => ({
        url: `category/${args.categoryId}/filters/${args.filterId}/variants/${args.id}`,
        method: "DELETE",
      }),
      onQueryStarted: async (
        { categoryId, filterId, id },
        { dispatch, queryFulfilled },
      ) => {
        const patchResult = dispatch(
          categoryApi.util.updateQueryData(
            "getFilters",
            { categoryId, withTranslations: true },
            (draft) => {
              const filter = draft.find((f) => f.id === filterId);
              if (filter)
                filter.variants = filter.variants.filter((v) => v.id !== id);
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    getCategoryNavigation: builder.query<CategoryNavigation[], string | void>({
      query: (category) => ({
        url: `category/navigation`,
        params: { category },
      }),
      providesTags: ["CategoryNavigation"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useChangeCategoryMutation,
  useGetCategoryByIdQuery,
  useGetFiltersQuery,
  useCreateFilterMutation,
  useCreateFilterVariantMutation,
  useChangeFilterMutation,
  useChangeFilterVariantMutation,
  useDeleteFilterMutation,
  useDeleteFilterVariantMutation,
  useGetCategoryNavigationQuery,
} = categoryApi;
