import { apiClient } from "../../lib/axios";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  owner_username: string;
  slug: string;
  database_type: string;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateProjectPayload = {
  name: string;
  description?: string;
  owner_username?: string;
  database_type?: string;
};

export type UpdateProjectPayload = {
  name?: string;
  description?: string | null;
  database_type?: string;
  is_favorite?: boolean;
  is_archived?: boolean;
};

export async function fetchProjects() {
  const response = await apiClient.get<Project[]>("/projects");
  return response.data;
}

export async function fetchProject(projectId: string) {
  const response = await apiClient.get<Project>(`/projects/${projectId}`);
  return response.data;
}

export async function fetchProjectBySlug(username: string, slug: string) {
  const response = await apiClient.get<Project>(`/u/${username}/diagrams/${slug}`);
  return response.data;
}

export async function createProject(payload: CreateProjectPayload) {
  const response = await apiClient.post<Project>("/projects", payload);
  return response.data;
}

export async function updateProject(projectId: string, payload: UpdateProjectPayload) {
  const response = await apiClient.patch<Project>(`/projects/${projectId}`, payload);
  return response.data;
}

export async function deleteProject(projectId: string) {
  await apiClient.delete(`/projects/${projectId}`);
}
