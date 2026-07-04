// shared/schema.ts
// Drizzle ORM schema — supports both PostgreSQL (production) and SQLite (local fallback)
// All business logic values come from env vars — nothing hardcoded here

import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import {
  sqliteTable,
  integer as sqliteInteger,
  text as sqliteText,
  real as sqliteReal,
} from "drizzle-orm/sqlite-core";
import { z } from "zod";

// ─── Runtime dialect detection ──────────────────────────────────────────────
export const USE_POSTGRES = Boolean(
  process.env.POSTGRES_URL ||
  (process.env.PG_HOST &&
    process.env.PG_USER &&
    process.env.PG_PASSWORD &&
    process.env.PG_DATABASE)
);

// ─── PostgreSQL tables ───────────────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  salutation: text("salutation"),
  firstName: text("first_name"),
  name: text("name").notNull(),
  company: text("company"),
  street: text("street"),
  zip: text("zip"),
  city: text("city"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentCountersTable = pgTable("document_counters", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'quote' | 'invoice' | 'protocol'
  year: integer("year").notNull(),
  lastNumber: integer("last_number").notNull().default(0),
});

export const quotesTable = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: text("quote_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customersTable.id),
  date: text("date").notNull(), // ISO date string
  validUntil: text("valid_until"),
  projectDescription: text("project_description"),
  notes: text("notes"),
  paymentTerms: text("payment_terms"),
  status: text("status").notNull().default("draft"), // draft | sent | accepted | rejected
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("19"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  vatAmount: numeric("vat_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  pdfS3Key: text("pdf_s3_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quoteItemsTable = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id")
    .notNull()
    .references(() => quotesTable.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  unit: text("unit").notNull().default("Stk"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  quoteId: integer("quote_id").references(() => quotesTable.id),
  customerId: integer("customer_id").references(() => customersTable.id),
  date: text("date").notNull(),
  dueDate: text("due_date"),
  paymentTerms: text("payment_terms"),
  projectDescription: text("project_description"),
  notes: text("notes"),
  status: text("status").notNull().default("draft"), // draft | sent | paid | overdue
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("19"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  vatAmount: numeric("vat_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  pdfS3Key: text("pdf_s3_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceItemsTable = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoicesTable.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  unit: text("unit").notNull().default("Stk"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const protocolsTable = pgTable("protocols", {
  id: serial("id").primaryKey(),
  protocolNumber: text("protocol_number").notNull().unique(),
  invoiceId: integer("invoice_id").references(() => invoicesTable.id),
  quoteId: integer("quote_id").references(() => quotesTable.id),
  customerId: integer("customer_id").references(() => customersTable.id),
  date: text("date").notNull(),
  projectDescription: text("project_description"),
  location: text("location"),
  notes: text("notes"),
  defects: text("defects"),
  status: text("status").notNull().default("draft"), // draft | completed | signed
  pdfS3Key: text("pdf_s3_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const protocolItemsTable = pgTable("protocol_items", {
  id: serial("id").primaryKey(),
  protocolId: integer("protocol_id")
    .notNull()
    .references(() => protocolsTable.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  description: text("description").notNull(),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes"),
});

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  unit: text("unit").notNull().default("Stk"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  category: text("category"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const unitsCatalogTable = pgTable("units_catalog", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const publicInquiriesTable = pgTable("public_inquiries", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  product: text("product"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  message: text("message").notNull(),
  consentAccepted: boolean("consent_accepted").notNull().default(true),
  fileCount: integer("file_count").notNull().default(0),
  uploadedFilesJson: text("uploaded_files_json").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── SQLite tables (local fallback) ─────────────────────────────────────────

export const usersTableSQLite = sqliteTable("users", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  email: sqliteText("email").notNull().unique(),
  passwordHash: sqliteText("password_hash").notNull(),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const customersTableSQLite = sqliteTable("customers", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  salutation: sqliteText("salutation"),
  firstName: sqliteText("first_name"),
  name: sqliteText("name").notNull(),
  company: sqliteText("company"),
  street: sqliteText("street"),
  zip: sqliteText("zip"),
  city: sqliteText("city"),
  email: sqliteText("email"),
  phone: sqliteText("phone"),
  notes: sqliteText("notes"),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const documentCountersTableSQLite = sqliteTable("document_counters", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  type: sqliteText("type").notNull(),
  year: sqliteInteger("year").notNull(),
  lastNumber: sqliteInteger("last_number").notNull().default(0),
});

export const quotesTableSQLite = sqliteTable("quotes", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  quoteNumber: sqliteText("quote_number").notNull().unique(),
  customerId: sqliteInteger("customer_id"),
  date: sqliteText("date").notNull(),
  validUntil: sqliteText("valid_until"),
  projectDescription: sqliteText("project_description"),
  notes: sqliteText("notes"),
  paymentTerms: sqliteText("payment_terms"),
  status: sqliteText("status").notNull().default("draft"),
  vatRate: sqliteReal("vat_rate").notNull().default(19),
  subtotal: sqliteReal("subtotal").notNull().default(0),
  vatAmount: sqliteReal("vat_amount").notNull().default(0),
  total: sqliteReal("total").notNull().default(0),
  pdfS3Key: sqliteText("pdf_s3_key"),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const quoteItemsTableSQLite = sqliteTable("quote_items", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  quoteId: sqliteInteger("quote_id").notNull(),
  position: sqliteInteger("position").notNull(),
  description: sqliteText("description").notNull(),
  quantity: sqliteReal("quantity").notNull().default(1),
  unit: sqliteText("unit").notNull().default("Stk"),
  unitPrice: sqliteReal("unit_price").notNull().default(0),
  total: sqliteReal("total").notNull().default(0),
});

export const invoicesTableSQLite = sqliteTable("invoices", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  invoiceNumber: sqliteText("invoice_number").notNull().unique(),
  quoteId: sqliteInteger("quote_id"),
  customerId: sqliteInteger("customer_id"),
  date: sqliteText("date").notNull(),
  dueDate: sqliteText("due_date"),
  paymentTerms: sqliteText("payment_terms"),
  projectDescription: sqliteText("project_description"),
  notes: sqliteText("notes"),
  status: sqliteText("status").notNull().default("draft"),
  vatRate: sqliteReal("vat_rate").notNull().default(19),
  subtotal: sqliteReal("subtotal").notNull().default(0),
  vatAmount: sqliteReal("vat_amount").notNull().default(0),
  total: sqliteReal("total").notNull().default(0),
  pdfS3Key: sqliteText("pdf_s3_key"),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const invoiceItemsTableSQLite = sqliteTable("invoice_items", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  invoiceId: sqliteInteger("invoice_id").notNull(),
  position: sqliteInteger("position").notNull(),
  description: sqliteText("description").notNull(),
  quantity: sqliteReal("quantity").notNull().default(1),
  unit: sqliteText("unit").notNull().default("Stk"),
  unitPrice: sqliteReal("unit_price").notNull().default(0),
  total: sqliteReal("total").notNull().default(0),
});

export const protocolsTableSQLite = sqliteTable("protocols", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  protocolNumber: sqliteText("protocol_number").notNull().unique(),
  invoiceId: sqliteInteger("invoice_id"),
  quoteId: sqliteInteger("quote_id"),
  customerId: sqliteInteger("customer_id"),
  date: sqliteText("date").notNull(),
  projectDescription: sqliteText("project_description"),
  location: sqliteText("location"),
  notes: sqliteText("notes"),
  defects: sqliteText("defects"),
  status: sqliteText("status").notNull().default("draft"),
  pdfS3Key: sqliteText("pdf_s3_key"),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const protocolItemsTableSQLite = sqliteTable("protocol_items", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  protocolId: sqliteInteger("protocol_id").notNull(),
  position: sqliteInteger("position").notNull(),
  description: sqliteText("description").notNull(),
  completed: sqliteInteger("completed", { mode: "boolean" }).notNull().default(false),
  notes: sqliteText("notes"),
});

export const servicesTableSQLite = sqliteTable("services", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  name: sqliteText("name").notNull(),
  description: sqliteText("description").notNull().default(""),
  unit: sqliteText("unit").notNull().default("Stk"),
  unitPrice: sqliteReal("unit_price").notNull().default(0),
  category: sqliteText("category"),
  notes: sqliteText("notes"),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const unitsCatalogTableSQLite = sqliteTable("units_catalog", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  name: sqliteText("name").notNull().unique(),
  sortOrder: sqliteInteger("sort_order").notNull().default(0),
});

export const publicInquiriesTableSQLite = sqliteTable("public_inquiries", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  type: sqliteText("type").notNull(),
  product: sqliteText("product"),
  name: sqliteText("name").notNull(),
  email: sqliteText("email").notNull(),
  phone: sqliteText("phone").notNull(),
  address: sqliteText("address"),
  message: sqliteText("message").notNull(),
  consentAccepted: sqliteInteger("consent_accepted", { mode: "boolean" }).notNull().default(true),
  fileCount: sqliteInteger("file_count").notNull().default(0),
  uploadedFilesJson: sqliteText("uploaded_files_json").notNull().default("[]"),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
});

// ─── Zod validation schemas ──────────────────────────────────────────────────

export const insertCustomerSchema = z.object({
  salutation: z.string().optional(),
  firstName: z.string().optional(),
  name: z.string().min(1, "Nachname ist erforderlich"),
  company: z.string().optional(),
  street: z.string().optional(),
  zip: z.string().optional(),
  city: z.string().optional(),
  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const documentItemSchema = z.object({
  position: z.coerce.number().int().positive(),
  description: z.string().min(1, "Beschreibung ist erforderlich"),
  quantity: z.coerce.number().positive("Menge muss positiv sein"),
  unit: z.string().min(1, "Einheit ist erforderlich"),
  unitPrice: z.coerce.number().min(0, "Preis darf nicht negativ sein"),
  total: z.coerce.number(),
});

export const insertQuoteSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  date: z.string().min(1, "Datum ist erforderlich"),
  validUntil: z.string().optional(),
  projectDescription: z.string().optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected"]).default("draft"),
  vatRate: z.coerce.number().min(0).max(100).default(19),
  subtotal: z.coerce.number().min(0).default(0),
  vatAmount: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0).default(0),
  items: z.array(documentItemSchema).default([]),
});

export const insertInvoiceSchema = z.object({
  quoteId: z.number().int().positive().optional().nullable(),
  customerId: z.number().int().positive().optional().nullable(),
  date: z.string().min(1, "Datum ist erforderlich"),
  dueDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  projectDescription: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
  vatRate: z.coerce.number().min(0).max(100).default(19),
  subtotal: z.coerce.number().min(0).default(0),
  vatAmount: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0).default(0),
  items: z.array(documentItemSchema).default([]),
});

export const insertProtocolSchema = z.object({
  invoiceId: z.number().int().positive().optional().nullable(),
  quoteId: z.number().int().positive().optional().nullable(),
  customerId: z.number().int().positive().optional().nullable(),
  date: z.string().min(1, "Datum ist erforderlich"),
  projectDescription: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  defects: z.string().optional(),
  status: z.enum(["draft", "completed", "signed"]).default("draft"),
  items: z
    .array(
      z.object({
        position: z.number().int().positive(),
        description: z.string().min(1),
        completed: z.union([z.boolean(), z.number()]).transform(Boolean).default(false),
        notes: z.string().nullish().transform((v) => v ?? ""),
      })
    )
    .default([]),
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type DocumentItem = z.infer<typeof documentItemSchema>;

export const insertServiceSchema = z.object({
  name: z.string().min(1, "Bezeichnung ist erforderlich"),
  description: z.string().default(""),
  unit: z.string().min(1, "Einheit ist erforderlich").default("Stk"),
  unitPrice: z.number().min(0, "Preis darf nicht negativ sein").default(0),
  category: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertService = z.infer<typeof insertServiceSchema>;

const publicInquiryBaseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(6).max(50),
  message: z.string().trim().min(10).max(4000),
  consent: z.coerce.boolean().refine((value) => value === true, {
    message: "Datenschutzeinwilligung ist erforderlich",
  }),
});

export const insertContactInquirySchema = publicInquiryBaseSchema;

export const insertOfferInquirySchema = publicInquiryBaseSchema.extend({
  product: z.string().trim().min(2).max(120),
  address: z.string().trim().max(200).optional().or(z.literal("")),
});

export const insertUnitSchema = z.object({
  name: z.string().min(1, "Einheit ist erforderlich"),
  sortOrder: z.number().int().default(0),
});

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type InsertContactInquiry = z.infer<typeof insertContactInquirySchema>;
export type InsertOfferInquiry = z.infer<typeof insertOfferInquirySchema>;
