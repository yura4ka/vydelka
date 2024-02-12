import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "../LanguageToggle";
import { useLogoutMutation } from "@/features/auth/authApiSlice";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import Logo from "@/assets/Fork.svg?react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CategoryNavigation,
  useGetCategoryNavigationQuery,
} from "@/features/categories/categoriesApiSlice";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const MAX_SUB = 10;

const Categories = () => {
  const { data: categories } = useGetCategoryNavigationQuery();

  return (
    <ul className="flex">
      <div className="group/all relative min-w-fit border-r">
        {categories?.map((c) => (
          <li className="group/item" key={c.id}>
            <Link
              to={c.slug}
              className="flex items-center justify-between gap-4 py-2 pl-4 text-sm font-medium transition-colors group-first/item:bg-accent group-hover/item:bg-accent group-hover/all:group-first/item:bg-background group-hover/all:group-[&:first-child:hover]/item:bg-accent group-has-[.last-category:hover]/all:group-first/item:bg-accent"
            >
              {c.title}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <ul className="absolute left-[calc(100%+1px)] top-0 hidden h-full w-max max-w-[calc(1280px-100%)] flex-col flex-wrap gap-x-8 gap-y-2 overflow-hidden bg-background px-4 py-2 pr-8 group-first/item:flex group-hover/item:flex group-hover/all:group-first/item:hidden group-hover/all:group-[&:first-child:hover]/item:flex group-has-[.last-category:hover]/all:group-first/item:flex">
              {c.subcategories?.map((c2) => (
                <li key={c2.id}>
                  <Link
                    to={c2.slug}
                    className="font-medium transition-colors hover:text-ring"
                  >
                    {c2.title}
                  </Link>
                  <ul className={c2.subcategories ? "mt-1 border-t pt-1" : ""}>
                    {c2.subcategories?.slice(0, MAX_SUB).map((c3) => (
                      <li key={c3.id}>
                        <Link
                          to={c3.slug}
                          className="block text-sm transition-colors hover:text-ring"
                        >
                          {c3.title}
                        </Link>
                      </li>
                    ))}
                    {c2.subcategories && c2.subcategories.length > MAX_SUB && (
                      <li>
                        <Link
                          to={c2.slug}
                          className="block text-sm font-medium transition-colors hover:text-ring"
                        >
                          View all...
                        </Link>
                      </li>
                    )}
                  </ul>
                </li>
              ))}
              <li>
                <Link
                  to={c.slug}
                  className="font-medium transition-colors hover:text-ring"
                >
                  View all...
                </Link>
              </li>
            </ul>
          </li>
        ))}
        <li className="last-category">
          <Link
            to="categories"
            className="block rounded-bl-md py-2 pl-4 text-sm font-medium transition-colors hover:text-ring"
          >
            All Categories...
          </Link>
        </li>
      </div>
    </ul>
  );
};

type MobileProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileCategories: React.FC<MobileProps> = ({ open, setOpen }) => {
  const { data: categories } = useGetCategoryNavigationQuery();
  const [activeCategory, setActiveCategory] =
    useState<CategoryNavigation | null>(null);
  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) setActiveCategory(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="flex w-full justify-start gap-1 border-y px-6 py-4 font-bold transition-colors hover:bg-accent">
          <LayoutGrid className="mr-2" /> Categories
        </button>
      </DialogTrigger>
      <DialogContent className="min-w-screen left-0 top-0 h-screen max-w-[auto] translate-x-0 translate-y-0 grid-rows-[auto_1fr] px-0 pb-0 data-[state=closed]:duration-300 data-[state=closed]:fade-out-100 data-[state=closed]:zoom-out-100 data-[state=closed]:slide-out-to-left-full data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-0">
        <DialogHeader className="sm:text-center">
          <DialogTitle>{activeCategory?.title ?? "Categories"}</DialogTitle>
        </DialogHeader>
        <div className="scrollbar relative overflow-x-hidden overflow-y-scroll">
          <ul className={cn(activeCategory && "h-full overflow-y-hidden")}>
            {categories?.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveCategory(c)}
                  className="flex w-full items-center justify-between gap-1 border-b p-4 font-medium transition-colors hover:bg-accent"
                >
                  {c.title}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
            <li>
              <Link
                to="categories"
                className="block p-4 font-medium transition-colors hover:bg-accent"
              >
                All Categories...
              </Link>
            </li>
          </ul>
          <ul
            className={cn(
              "absolute right-[100vw] top-0 h-full w-full bg-background transition-all duration-300",
              activeCategory && "right-0",
            )}
          >
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center justify-between gap-1 p-4 font-medium hover:underline"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" /> All
              categories
            </button>
            {activeCategory?.subcategories?.map((c2) => (
              <li key={c2.title} className="border-b">
                <Link
                  to={c2.slug}
                  className="block p-4 font-medium hover:bg-accent"
                >
                  {c2.title}
                </Link>
                <ul>
                  {c2.subcategories?.slice(0, MAX_SUB).map((c3) => (
                    <li
                      key={c3.id}
                      className="px-4 py-1 text-sm font-medium text-muted-foreground first:pt-0"
                    >
                      <Link to={c3.slug} className="hover:underline">
                        {c3.title}
                      </Link>
                    </li>
                  ))}
                  {c2.subcategories && c2.subcategories.length > MAX_SUB && (
                    <li className="px-4 py-1 text-sm font-medium text-muted-foreground hover:underline">
                      <Link to={c2.slug}>View all...</Link>
                    </li>
                  )}
                </ul>
              </li>
            ))}
            <li>
              <Link
                to={activeCategory?.slug ?? ""}
                className="block p-4 font-medium hover:bg-accent"
              >
                View all...
              </Link>
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MobileMenu = () => {
  const [logout] = useLogoutMutation();
  const { isAuth, user } = useAuth();

  const [open, setOpen] = useState(false);
  const [isCategoryOpen, setCategoryOpen] = useState(false);
  const onCategoryOpenChange = (open: boolean) => {
    setCategoryOpen(open);
    if (!open) setOpen(false);
  };

  const handleLogout = () => {
    logout();
    onCategoryOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="xs:w-3/4 w-full px-0 lg:hidden"
        overlayClass="lg:hidden"
      >
        <div className="flex items-center justify-between px-6">
          <SheetTitle className="flex items-center gap-4 font-bold">
            <Logo className="h-5 w-5" />
            VYDELKA
          </SheetTitle>
          <div className="flex items-center">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).nodeName === "A") {
              onCategoryOpenChange(false);
            }
          }}
          className="flex h-full w-full flex-col justify-between py-3"
        >
          <div>
            <MobileCategories
              open={isCategoryOpen}
              setOpen={onCategoryOpenChange}
            />
            <button className="flex w-full justify-start gap-1 border-b px-6 py-4 font-bold transition-colors hover:bg-accent">
              <ShoppingCart className="mr-2" /> Cart
            </button>
            {isAuth && (
              <div onClick={() => setOpen(false)}>
                <Link
                  to={"profile"}
                  className="flex w-full items-center justify-start gap-1 border-b px-6 py-4 font-bold transition-colors hover:bg-accent"
                >
                  <UserRound className="mr-2" />
                  Profile
                </Link>
                <Link
                  to={"orders"}
                  className="flex w-full items-center justify-start gap-1 border-b px-6 py-4 font-bold transition-colors hover:bg-accent"
                >
                  <ScrollText className="mr-2" />
                  Orders
                </Link>
                {user.isAdmin && (
                  <Link
                    to={"admin/categories"}
                    className="flex w-full items-center justify-start gap-1 border-b px-6 py-4 font-bold transition-colors hover:bg-accent"
                  >
                    <Settings className="mr-2" />
                    Admin Settings
                  </Link>
                )}
              </div>
            )}
          </div>
          <Button asChild className="mx-6 mb-3">
            {isAuth ? (
              <button onClick={handleLogout}>
                Logout <LogOut className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <Link to={"auth/sign-in"}>
                Sign In <LogIn className="ml-2 h-4 w-4" />
              </Link>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const UserButton = () => {
  const [logout] = useLogoutMutation();
  const { isLoading, isAuth, user } = useAuth();

  if (isLoading)
    return (
      <Button size="icon" variant="ghost" className="hidden sm:inline-flex">
        <UserRound className="h-5 w-5" />
      </Button>
    );

  if (!isAuth)
    return (
      <Button size="icon" variant="ghost" asChild>
        <Link to="auth/sign-in">
          <UserRound className="h-5 w-5" />
        </Link>
      </Button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="secondary" className="rounded-full">
          {user.firstName[0] + user.lastName[0]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          {user.firstName} {user.lastName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link to={`/profile`}>
          <DropdownMenuItem className="cursor-pointer">
            <UserRound className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </Link>
        <Link to={`/orders`}>
          <DropdownMenuItem className="cursor-pointer">
            <ScrollText className="mr-2 h-4 w-4" />
            <span>Orders</span>
          </DropdownMenuItem>
        </Link>
        {user.isAdmin && (
          <Link to={`/admin/categories`}>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Admin Settings</span>
            </DropdownMenuItem>
          </Link>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const Navbar = () => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="xs:px-4 flex h-14 max-w-screen-2xl gap-4 px-2 sm:container md:justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <MobileMenu />

          <Link to="/" className="flex items-center gap-4 text-xl font-bold">
            <Logo className="h-8 w-8" />
            <span className="hidden md:inline">VYDELKA</span>
          </Link>

          <Dialog modal={false}>
            <DialogTrigger asChild>
              <Button variant="outline" className="hidden lg:flex">
                <LayoutGrid className="mr-2" /> Categories
              </Button>
            </DialogTrigger>
            <DialogContent className="top-14 max-h-[calc(100vh-3.5rem)] max-w-screen-xl translate-y-0 p-0 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2">
              <Categories />
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex grow items-center gap-2 sm:gap-4 md:grow-0">
          <form className="grow">
            <Input placeholder={t("search-placeholder")} name="search" />
          </form>
          <div className="flex items-center">
            <Button size="icon" variant="ghost">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <div className="hidden sm:flex">
              <UserButton />
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
