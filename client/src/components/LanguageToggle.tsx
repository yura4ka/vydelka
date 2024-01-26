import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const languages = [
  { value: "en", title: "🇺🇸 English" },
  { value: "ua", title: "🇺🇦 Українська" },
];

export const LanguageToggle = () => {
  const { i18n } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          {i18n.resolvedLanguage}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.value}
            onClick={() => i18n.changeLanguage(l.value)}
          >
            {l.title}
          </DropdownMenuItem>
        ))}
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
