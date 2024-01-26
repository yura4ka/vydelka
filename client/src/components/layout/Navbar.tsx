import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PersonIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "../LanguageToggle";

const categories = [
  {
    title: "computers laptops",
    children: [
      { title: "computers" },
      { title: "laptops" },
      { title: "computers" },
      { title: "laptops" },
      { title: "computers" },
    ],
  },
  {
    title: "computers laptops2",
    children: [{ title: "computers" }, { title: "laptops" }],
  },
  {
    title: "computers laptops3",
    children: [
      { title: "computers" },
      { title: "laptops" },
      { title: "computers" },
      { title: "laptops" },
    ],
  },
  {
    title: "computers laptops4",
    children: [
      { title: "computers" },
      { title: "laptops" },
      { title: "computers" },
    ],
  },
  {
    title: "computers laptops4",
    children: [
      { title: "computers" },
      { title: "laptops" },
      { title: "computers" },
      { title: "laptops" },
      { title: "computers" },
      { title: "laptops" },
      { title: "computers" },
      { title: "laptops" },
    ],
  },
  {
    title: "computers laptops5",
    children: [
      { title: "computers" },
      { title: "laptops" },
      { title: "computers" },
      { title: "laptops" },
      { title: "computers" },
      { title: "laptops" },
      { title: "computers" },
      { title: "laptops" },
      { title: "computers" },
    ],
  },
  {
    title: "computers laptops6",
    children: [{ title: "computers" }, { title: "laptops" }],
  },
  {
    title: "computers laptops7",
    children: [{ title: "computers" }, { title: "laptops" }],
  },
  {
    title: "computers laptops8",
    children: [{ title: "computers" }, { title: "laptops" }],
  },
  {
    title: "computers laptops9",
    children: [{ title: "computers" }, { title: "laptops" }],
  },
  {
    title: "computers laptops10",
    children: [{ title: "computers" }, { title: "laptops" }],
  },
];

export const Navbar = () => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl justify-between">
        <div className="flex gap-4 items-stretch">
          <Link to="/" className="font-bold text-xl self-center">
            VYDELKA
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-md">
                  {t("categories")}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {categories.map((c, i) => (
                      <li
                        key={i}
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <NavigationMenuLink>
                          <div className="text-sm font-medium leading-none">
                            {c.title}
                          </div>
                          <ul>
                            {c.children.map((ch, j) => (
                              <li key={j}>{ch.title}</li>
                            ))}
                          </ul>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-4">
          <form>
            <Input placeholder={t("search-placeholder")} />
          </form>
          <div className="flex items-center">
            <Button size="icon" variant="ghost">
              <PersonIcon className="h-5 w-5" />
            </Button>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
