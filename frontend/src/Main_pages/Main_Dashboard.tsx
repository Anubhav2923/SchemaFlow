import { useAuth } from "@clerk/clerk-react";
import { Navbar } from "../components/layout/Navbar";
import { useTheme } from "../hooks/useTheme";
import DashboardCore from "./Dashboard/Dashboard";
import { GuestDashboard } from "./Dashboard/components/GuestDashboard";
import { useCreateProject } from "../features/projects/hooks";
import { useState } from "react";
import type { FormEvent } from "react";
import { slugify } from "./Dashboard/utils";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function MainDashboard() {
  const { userId, isLoaded } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // For the Guest View
  const createProjectMutation = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useUser();
  const navigate = useNavigate();

  async function handleGuestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    const ownerUsername = slugify(
      user?.username?.trim() || user?.firstName?.trim() || user?.emailAddresses[0]?.emailAddress?.split("@")[0] || "user"
    ) || "user";

    const createdProject = await createProjectMutation.mutateAsync({
      name: name.trim(),
      description: description.trim(),
      owner_username: ownerUsername,
      database_type: "postgresql",
    });

    if (createdProject?.id) {
      navigate(`/u/${encodeURIComponent(createdProject.owner_username)}/diagrams/${encodeURIComponent(createdProject.slug)}`);
    }
  }

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[var(--page-bg)] selection:bg-indigo-500 selection:text-white">
      {/* ── Navbar logic stays dynamically outside the core pages ── */}
      <Navbar theme={theme} onToggle={toggleTheme} />

      {userId ? (
        // ── Auth'd Dashboard logic starts here ──
        <DashboardCore userId={userId} />
      ) : (
        // ── Guest Marketing logic starts here ──
        <GuestDashboard
          handleSubmit={handleGuestSubmit}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          isPending={createProjectMutation.isPending}
        />
      )}
    </div>
  );
}
