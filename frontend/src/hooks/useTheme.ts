import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (window.localStorage.getItem("schemaforge-theme") as Theme) || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.dataset.theme = theme;
    if (theme === "dark") {
       root.classList.add("dark");
    } else {
       root.classList.remove("dark");
    }
    window.localStorage.setItem("schemaforge-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return { theme, toggleTheme, isDark: theme === "dark" };
}
