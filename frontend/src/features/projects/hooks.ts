import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
  fetchProject,
  fetchProjectBySlug,
  fetchProjects,
  updateProject,
} from "./api";
import type { CreateProjectPayload, UpdateProjectPayload } from "./api";

export function useProjects(userId?: string | null) {
  return useQuery({
    queryKey: ["projects", userId ?? "guest"],
    queryFn: fetchProjects,
    enabled: Boolean(userId),
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: Boolean(projectId),
  });
}

export function useProjectBySlug(username: string, slug: string) {
  return useQuery({
    queryKey: ["projects", username, slug],
    queryFn: () => fetchProjectBySlug(username, slug),
    enabled: Boolean(username && slug),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: UpdateProjectPayload;
    }) => updateProject(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
