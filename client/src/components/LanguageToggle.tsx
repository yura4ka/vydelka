import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/app/hooks";
import { api } from "@/app/api/apiSlice";

const languages = [
  { value: "en", title: "🇺🇸 English" },
  { value: "uk", title: "🇺🇦 Українська" },
];

export const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const onChange = (lang: string) => {
    i18n.changeLanguage(lang);
    dispatch(api.util.resetApiState());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          {i18n.resolvedLanguage}
          <span className="sr-only">change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((l) => (
          <DropdownMenuItem key={l.value} onClick={() => onChange(l.value)}>
            {l.title}
          </DropdownMenuItem>
        ))}
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
