export type Language = "ua" | "en";

export type Translation = {
  [l in Language]: string;
};

export function createTranslation(): Translation {
  return {
    en: "",
    ua: "",
  };
}
