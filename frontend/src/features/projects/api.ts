import { apiClient } from "../../lib/axios";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type CreateProjectPayload = {
  name: string;
  description?: string;
};

export async function fetchProjects() {
  const response = await apiClient.get<Project[]>("/projects");
  return response.data;
}

export async function fetchProject(projectId: string) {
  const response = await apiClient.get<Project>(`/projects/${projectId}`);
  return response.data;
}

export async function createProject(payload: CreateProjectPayload) {
  const response = await apiClient.post<Project>("/projects", payload);
  return response.data;
}

export async function deleteProject(projectId: string) {
  await apiClient.delete(`/projects/${projectId}`);
}
