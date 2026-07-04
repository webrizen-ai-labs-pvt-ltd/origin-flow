import { Moon, Sun } from "lucide-react";
import { Button } from "./base/buttons/button";
import { useTheme } from "../providers/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      color="secondary"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 aspect-square relative"
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark-mode:-rotate-90 dark-mode:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark-mode:rotate-0 dark-mode:scale-100" />
    </Button>
  );
}
