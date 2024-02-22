export type Language = "uk" | "en";

export type Translation = {
  [l in Language]: string;
};

export function createTranslation(): Translation {
  return {
    en: "",
    uk: "",
  };
}
