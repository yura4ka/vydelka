import { Mail } from "lucide-react";
import { Button } from "../ui/button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export const Footer = () => {
  return (
    <footer className="border-t py-4">
      <div className="container flex max-w-screen-2xl flex-col items-center justify-between xs:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy;2024 All rights reserved.
        </p>
        <p>
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/yura4ka/vydelka" target="__blank">
              <GitHubLogoIcon className="size-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href={`mailto:${import.meta.env.VITE_EMAIL}`}>
              <Mail className="size-4" />
            </a>
          </Button>
        </p>
      </div>
    </footer>
  );
};
