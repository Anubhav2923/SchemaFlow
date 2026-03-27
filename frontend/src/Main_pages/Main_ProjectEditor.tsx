import { useParams } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { useTheme } from "../hooks/useTheme";
import ProjectEditorCore from "./ProjectEditor/ProjectEditor";

export default function MainProjectEditor() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { projectId = "", username = "", diagramSlug = "" } = useParams();

  return (
    <main className={`h-screen flex flex-col overflow-hidden ${isDark ? "bg-[#020617]" : "bg-[#f8fafc]"}`}>
      <div className="flex-none pt-2">
        <Navbar theme={theme} onToggle={toggleTheme} />
      </div>

      <div className="flex-1 w-full relative min-h-0 pt-20">
        <ProjectEditorCore 
          projectId={projectId} 
          username={username} 
          diagramSlug={diagramSlug} 
        />
      </div>
    </main>
  );
}
