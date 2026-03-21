import type { Project } from "../../features/projects/api";

export function formatDate(value: string | null | undefined) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export type ViewType = "all" | "favorites" | "archived" | "shared" | "folders" | "templates";

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function projectHref(project: Project) {
  return `/u/${encodeURIComponent(project.owner_username)}/diagrams/${encodeURIComponent(project.slug)}`;
}
