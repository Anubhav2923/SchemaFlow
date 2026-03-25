import type { ExportFormat } from "../../features/schema/api";
import type { NodeTypes, EdgeTypes } from "reactflow";
import { TableNode } from "../../components/schema/TableNode";
import { GroupNode } from "../../components/schema/GroupNode";
import { RelationshipEdge } from "../../components/schema/RelationshipEdge";
import type { SchemaTable, SchemaColumn, SchemaRelationship, AiGeneratedTable, AiGeneratedRelationship } from "../../features/schema/api";

// ─── PostgreSQL data types ────────────────────────────────────────────────────
export const PG_TYPES = [
  { group: "Text", options: ["varchar(255)", "varchar(100)", "text", "char(1)", "character varying"] },
  { group: "Integer", options: ["int", "integer", "bigint", "smallint", "serial", "bigserial", "smallserial"] },
  { group: "Decimal", options: ["numeric(10,2)", "decimal(10,2)", "real", "float", "double precision", "money"] },
  { group: "Date & Time", options: ["timestamp", "timestamptz", "date", "time", "timetz", "interval"] },
  { group: "Boolean", options: ["boolean"] },
  { group: "JSON", options: ["json", "jsonb"] },
  { group: "Binary", options: ["bytea"] },
  { group: "UUID", options: ["uuid"] },
  { group: "Array", options: ["text[]", "int[]", "jsonb[]"] },
  { group: "Network", options: ["inet", "cidr", "macaddr"] },
  { group: "Geo", options: ["point", "line", "polygon", "geometry"] },
  { group: "Other", options: ["xml", "tsvector", "tsquery", "oid"] },
];

// ─── Professional Color Palette ──────────────────────────────────────────────
export const SIDEBAR_COLORS = [
  "#818cf8", // indigo-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#fb7185", // rose-400
  "#22d3ee", // cyan-400
  "#a78bfa", // violet-400
  "#f472b6", // pink-400
  "#38bdf8", // sky-400
  "#2dd4bf", // teal-400
  "#60a5fa", // blue-400
];

export function getTableColor(index: number) {
  return SIDEBAR_COLORS[index % SIDEBAR_COLORS.length];
}

// ─── Cardinality colors and labels ───────────────────────────────────────────
export const CARDINALITY_COLOR: Record<string, string> = {
  "one-to-one": "#22d3ee",
  "one-to-many": "#818cf8",
  "many-to-many": "#c084fc",
};
export const CARDINALITY_LABEL: Record<string, string> = {
  "one-to-one": "1 : 1",
  "one-to-many": "1 : N",
  "many-to-many": "N : M",
};

// ─── ReactFlow registry ───────────────────────────────────────────────────────
export const NODE_TYPES: NodeTypes = Object.freeze({ tableNode: TableNode, groupNode: GroupNode });
export const EDGE_TYPES: EdgeTypes = Object.freeze({ relationshipEdge: RelationshipEdge });

// ─── Empty state constants ────────────────────────────────────────────────────
export const EMPTY_TABLES: SchemaTable[] = [];
export const EMPTY_COLUMNS: SchemaColumn[] = [];
export const EMPTY_RELS: SchemaRelationship[] = [];

// ─── Export formats ───────────────────────────────────────────────────────────
export const EXPORT_FORMATS: Array<{ value: ExportFormat; label: string }> = [
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mongoose", label: "MongoDB / Mongoose" },
  { value: "prisma", label: "Prisma" },
  { value: "drizzle", label: "Drizzle ORM" },
  { value: "typeorm", label: "TypeORM" },
  { value: "sequelize", label: "Sequelize" },
  { value: "laravel", label: "Laravel" },
];

// ─── Database options ─────────────────────────────────────────────────────────
export const DATABASE_OPTIONS = ["postgresql", "mongodb", "mysql", "sqlserver"] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export type ImportableEnumType = {
  name: string;
  values: string[];
};

export type ImportableCheckConstraint = {
  tableName: string;
  expression: string;
  name?: string;
  columnName?: string;
};

export type ImportableIndex = {
  tableName: string;
  columns: string[];
  name?: string;
  isUnique?: boolean;
};

export type ImportableSchemaMetadata = {
  dialect?: string;
  extensions?: string[];
  enumTypes?: ImportableEnumType[];
  checks?: ImportableCheckConstraint[];
  indexes?: ImportableIndex[];
};

export type ImportableSchema = {
  summary?: string;
  tables: AiGeneratedTable[];
  relationships: AiGeneratedRelationship[];
  metadata?: ImportableSchemaMetadata;
};

export type PreviewSchemaData = {
  tables: SchemaTable[];
  columns: SchemaColumn[];
  relationships: SchemaRelationship[];
};
export type TemplatePreviewLayout = Record<string, { x: number; y: number }>;
export type TemplateSchema = {
  id: string;
  name: string;
  description: string;
  schema: ImportableSchema;
  previewLayout?: TemplatePreviewLayout;
};

// ─── Template Schemas ─────────────────────────────────────────────────────────
export const TEMPLATE_SCHEMAS: TemplateSchema[] = [
  {
    id: "blog",
    name: "Blog",
    description: "Posts, authors, categories, comments, and tags.",
    previewLayout: {
      comments: { x: 100, y: 160 },
      posts: { x: 620, y: 20 },
      users: { x: 600, y: 460 },
      categories: { x: 920, y: 300 },
    },
    schema: {
      summary: "A publishing-friendly schema for blogs and editorial workflows.",
      tables: [
        { name: "users", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "email", data_type: "varchar(255)", is_unique: true, is_nullable: false }, { name: "display_name", data_type: "varchar(120)", is_nullable: false }] },
        { name: "posts", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "author_id", data_type: "uuid", is_nullable: false }, { name: "title", data_type: "varchar(255)", is_nullable: false }, { name: "slug", data_type: "varchar(255)", is_unique: true, is_nullable: false }, { name: "body", data_type: "text", is_nullable: false }, { name: "published_at", data_type: "timestamp", is_nullable: true }] },
        { name: "comments", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "post_id", data_type: "uuid", is_nullable: false }, { name: "user_id", data_type: "uuid", is_nullable: false }, { name: "body", data_type: "text", is_nullable: false }] },
        { name: "categories", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "name", data_type: "varchar(120)", is_unique: true, is_nullable: false }] },
      ],
      relationships: [
        { sourceTable: "posts", sourceColumn: "author_id", targetTable: "users", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "comments", sourceColumn: "post_id", targetTable: "posts", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "comments", sourceColumn: "user_id", targetTable: "users", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
      ],
    },
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Catalog, carts, orders, payments, and fulfillment.",
    previewLayout: {
      order_items: { x: 140, y: 260 },
      orders: { x: 500, y: 40 },
      customers: { x: 1020, y: 60 },
      products: { x: 790, y: 340 },
    },
    schema: {
      summary: "A transactional starter for storefronts and ordering systems.",
      tables: [
        { name: "customers", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "email", data_type: "varchar(255)", is_unique: true, is_nullable: false }, { name: "full_name", data_type: "varchar(140)", is_nullable: false }] },
        { name: "products", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "name", data_type: "varchar(255)", is_nullable: false }, { name: "sku", data_type: "varchar(80)", is_unique: true, is_nullable: false }, { name: "price", data_type: "numeric(10,2)", is_nullable: false }] },
        { name: "orders", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "customer_id", data_type: "uuid", is_nullable: false }, { name: "status", data_type: "varchar(50)", is_nullable: false }, { name: "total_amount", data_type: "numeric(10,2)", is_nullable: false }] },
        { name: "order_items", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "order_id", data_type: "uuid", is_nullable: false }, { name: "product_id", data_type: "uuid", is_nullable: false }, { name: "quantity", data_type: "integer", is_nullable: false }, { name: "unit_price", data_type: "numeric(10,2)", is_nullable: false }] },
      ],
      relationships: [
        { sourceTable: "orders", sourceColumn: "customer_id", targetTable: "customers", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "order_items", sourceColumn: "order_id", targetTable: "orders", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "order_items", sourceColumn: "product_id", targetTable: "products", targetColumn: "id", on_delete: "RESTRICT", on_update: "CASCADE" },
      ],
    },
  },
  {
    id: "saas",
    name: "SaaS Starter",
    description: "Organizations, users, memberships, billing, and projects.",
    previewLayout: {
      projects: { x: 260, y: 20 },
      organizations: { x: 980, y: 220 },
      memberships: { x: 260, y: 330 },
      users: { x: 850, y: 520 },
    },
    schema: {
      summary: "A multi-tenant SaaS baseline with teams and subscription-friendly entities.",
      tables: [
        { name: "organizations", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "name", data_type: "varchar(255)", is_nullable: false }, { name: "slug", data_type: "varchar(255)", is_unique: true, is_nullable: false }] },
        { name: "users", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "email", data_type: "varchar(255)", is_unique: true, is_nullable: false }, { name: "full_name", data_type: "varchar(140)", is_nullable: false }] },
        { name: "memberships", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "organization_id", data_type: "uuid", is_nullable: false }, { name: "user_id", data_type: "uuid", is_nullable: false }, { name: "role", data_type: "varchar(50)", is_nullable: false }] },
        { name: "projects", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "organization_id", data_type: "uuid", is_nullable: false }, { name: "name", data_type: "varchar(255)", is_nullable: false }] },
      ],
      relationships: [
        { sourceTable: "memberships", sourceColumn: "organization_id", targetTable: "organizations", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "memberships", sourceColumn: "user_id", targetTable: "users", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "projects", sourceColumn: "organization_id", targetTable: "organizations", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
      ],
    },
  },
];
