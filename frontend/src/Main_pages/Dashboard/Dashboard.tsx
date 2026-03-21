import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { setAuthToken } from "../../lib/axios";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "../../features/projects/hooks";
import type { Project } from "../../features/projects/api";
import type { DiagramDatabaseType } from "../../components/modals/NewDiagramModal";
import { slugify, type ViewType } from "./utils";
import { AuthenticatedDashboard } from "./components/AuthenticatedDashboard";

export default function DashboardCore({ userId }: { userId: string }) {
  const { getToken } = useAuth();
  const [authReady, setAuthReady] = useState(false);
  const { data: projects = [], isLoading } = useProjects(authReady ? userId : null);
  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();
  const updateProjectMutation = useUpdateProject();
  const { user } = useUser();
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState<ViewType>("all");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [databaseType, setDatabaseType] = useState<DiagramDatabaseType>("postgresql");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncAuthToken() {
      if (!userId) {
        setAuthToken(null);
        if (isMounted) setAuthReady(false);
        return;
      }
      const token = await getToken();
      setAuthToken(token);
      if (isMounted) setAuthReady(Boolean(token));
    }
    void syncAuthToken();

    return () => { isMounted = false; };
  }, [getToken, userId]);

  const visibleProjects = useMemo(() => {
    switch (currentView) {
      case "favorites": return projects.filter((p: Project) => p.is_favorite && !p.is_archived);
      case "archived": return projects.filter((p: Project) => p.is_archived);
      default: return projects.filter((p: Project) => !p.is_archived);
    }
  }, [currentView, projects]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    const ownerUsername = slugify(user?.username?.trim() || user?.firstName?.trim() || user?.emailAddresses[0]?.emailAddress?.split("@")[0] || "user") || "user";

    const createdProject = await createProjectMutation.mutateAsync({
      name: name.trim(),
      description: description.trim(),
      owner_username: ownerUsername,
      database_type: databaseType,
    });

    setName("");
    setDescription("");
    setIsModalOpen(false);

    if (createdProject?.id) {
      navigate(`/u/${encodeURIComponent(createdProject.owner_username)}/diagrams/${encodeURIComponent(createdProject.slug)}`);
    }
  }

  function handleDelete(projectId: string) {
    if (confirm("Are you absolutely sure you want to delete this project? This action cannot be undone.")) {
      deleteProjectMutation.mutate(projectId);
    }
  }

  function handleToggleFavorite(project: Project) {
    updateProjectMutation.mutate({ projectId: project.id, payload: { is_favorite: !project.is_favorite } });
  }

  function handleToggleArchive(project: Project) {
    updateProjectMutation.mutate({ projectId: project.id, payload: { is_archived: !project.is_archived } });
  }

  return (
    <AuthenticatedDashboard
      isLoading={isLoading}
      projects={projects}
      visibleProjects={visibleProjects}
      currentView={currentView}
      setCurrentView={setCurrentView}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      handleSubmit={handleSubmit}
      name={name}
      setName={setName}
      description={description}
      setDescription={setDescription}
      databaseType={databaseType}
      setDatabaseType={setDatabaseType}
      visibility={visibility}
      setVisibility={setVisibility}
      isPending={createProjectMutation.isPending}
      onDelete={handleDelete}
      onToggleFavorite={handleToggleFavorite}
      onToggleArchive={handleToggleArchive}
    />
  );
}
