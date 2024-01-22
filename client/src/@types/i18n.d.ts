import translation from "@/lib/i18n/locales/en/translation.json";

declare module "i18next" {
  interface CustomTypeOptions {
    resources: {
      translation: typeof translation;
    };
  }
}
