import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (window.localStorage.getItem("schemaflow-theme") as Theme) || "light";
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
    window.localStorage.setItem("schemaflow-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return { theme, toggleTheme, isDark: theme === "dark" };
}
