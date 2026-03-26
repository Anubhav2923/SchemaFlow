import { Navbar } from "../components/layout/Navbar";
import { useTheme } from "../hooks/useTheme";
import { Documentation } from "./Docs/Docs";

export default function DocsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-nebula-950 selection:bg-accent-primary/30">
      <Navbar theme={theme} onToggle={toggleTheme} />
      <Documentation />
    </div>
  );
}
