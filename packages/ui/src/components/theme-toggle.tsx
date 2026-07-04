import { Moon, Sun } from "lucide-react";
import { Button } from "./base/buttons/button";
import { useTheme } from "../providers/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      color="secondary"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative p-2 aspect-square rounded-full overflow-hidden"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="sr-only">Toggle theme</span>
      
      <span className="relative block w-[1.2rem] h-[1.2rem]">
        <Sun 
          className={`absolute inset-0 h-full w-full transition-all duration-500 ease-in-out
            ${isDark 
              ? 'rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
            }`}
        />
        <Moon 
          className={`absolute inset-0 h-full w-full transition-all duration-500 ease-in-out
            ${isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
            }`}
        />
      </span>
    </Button>
  );
}