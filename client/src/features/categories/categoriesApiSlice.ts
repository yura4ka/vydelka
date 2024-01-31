import { api } from "@/app/api/apiSlice";
import { Language, Translation } from "../translations";
import i18next from "i18next";

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

export type ChangeCategory = {
  id: string;
} & NewCategory;

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
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useChangeCategoryMutation,
  useGetCategoryByIdQuery,
} = categoryApi;
