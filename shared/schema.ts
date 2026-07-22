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
  downPaymentPercent: numeric("down_payment_percent", { precision: 5, scale: 2 }).notNull().default("50"),
  status: text("status").notNull().default("draft"), // draft | sent | accepted | rejected
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("19"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  vatAmount: numeric("vat_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  // Abweichende Rechnungsadresse
  billingName: text("billing_name"),
  billingStreet: text("billing_street"),
  billingZip: text("billing_zip"),
  billingCity: text("billing_city"),
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
  manufacturer: text("manufacturer"),
  productCategoryId: integer("product_category_id"),
  productInfoTitle: text("product_info_title"),
  productInfoText: text("product_info_text"),
  productDescription: text("product_description"),
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
  invoiceType: text("invoice_type").notNull().default("standard"),
  invoiceGroupNumber: text("invoice_group_number"),
  installmentIndex: integer("installment_index"),
  creditedInvoiceId: integer("credited_invoice_id"),
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
  // Abweichende Rechnungsadresse
  billingName: text("billing_name"),
  billingStreet: text("billing_street"),
  billingZip: text("billing_zip"),
  billingCity: text("billing_city"),
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
  manufacturer: text("manufacturer"),
  productCategoryId: integer("product_category_id"),
  productInfoTitle: text("product_info_title"),
  productInfoText: text("product_info_text"),
  productDescription: text("product_description"),
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

export const manufacturersTable = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  website: text("website"),
  contactInfo: text("contact_info"),
  markupPercent: numeric("markup_percent", { precision: 6, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productCategoriesTable = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  manufacturerId: integer("manufacturer_id")
    .notNull()
    .references(() => manufacturersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  productInfoText: text("product_info_text"),
  parentId: integer("parent_id"), // self-FK — no .references() to avoid circular at definition time
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const catalogItemsTable = pgTable("catalog_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => productCategoriesTable.id, { onDelete: "cascade" }),
  articleNumber: text("article_number"),
  name: text("name").notNull(),
  description: text("description"),
  productDescription: text("product_description"),
  unit: text("unit").notNull().default("Stk"), // m | m² | lfm | Stk | Pauschal | etc.
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  downPaymentPercent: sqliteReal("down_payment_percent").notNull().default(50),
  status: sqliteText("status").notNull().default("draft"),
  vatRate: sqliteReal("vat_rate").notNull().default(19),
  subtotal: sqliteReal("subtotal").notNull().default(0),
  vatAmount: sqliteReal("vat_amount").notNull().default(0),
  total: sqliteReal("total").notNull().default(0),
  // Abweichende Rechnungsadresse
  billingName: sqliteText("billing_name"),
  billingStreet: sqliteText("billing_street"),
  billingZip: sqliteText("billing_zip"),
  billingCity: sqliteText("billing_city"),
  pdfS3Key: sqliteText("pdf_s3_key"),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const quoteItemsTableSQLite = sqliteTable("quote_items", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  quoteId: sqliteInteger("quote_id").notNull(),
  position: sqliteInteger("position").notNull(),
  description: sqliteText("description").notNull(),
  manufacturer: sqliteText("manufacturer"),
  productCategoryId: sqliteInteger("product_category_id"),
  productInfoTitle: sqliteText("product_info_title"),
  productInfoText: sqliteText("product_info_text"),
  productDescription: sqliteText("product_description"),
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
  invoiceType: sqliteText("invoice_type").notNull().default("standard"),
  invoiceGroupNumber: sqliteText("invoice_group_number"),
  installmentIndex: sqliteInteger("installment_index"),
  creditedInvoiceId: sqliteInteger("credited_invoice_id"),
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
  // Abweichende Rechnungsadresse
  billingName: sqliteText("billing_name"),
  billingStreet: sqliteText("billing_street"),
  billingZip: sqliteText("billing_zip"),
  billingCity: sqliteText("billing_city"),
  pdfS3Key: sqliteText("pdf_s3_key"),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const invoiceItemsTableSQLite = sqliteTable("invoice_items", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  invoiceId: sqliteInteger("invoice_id").notNull(),
  position: sqliteInteger("position").notNull(),
  description: sqliteText("description").notNull(),
  manufacturer: sqliteText("manufacturer"),
  productCategoryId: sqliteInteger("product_category_id"),
  productInfoTitle: sqliteText("product_info_title"),
  productInfoText: sqliteText("product_info_text"),
  productDescription: sqliteText("product_description"),
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

export const manufacturersTableSQLite = sqliteTable("manufacturers", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  name: sqliteText("name").notNull().unique(),
  description: sqliteText("description"),
  website: sqliteText("website"),
  contactInfo: sqliteText("contact_info"),
  markupPercent: sqliteReal("markup_percent").notNull().default(0),
  sortOrder: sqliteInteger("sort_order").notNull().default(0),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const productCategoriesTableSQLite = sqliteTable("product_categories", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  manufacturerId: sqliteInteger("manufacturer_id").notNull(),
  name: sqliteText("name").notNull(),
  description: sqliteText("description"),
  productInfoText: sqliteText("product_info_text"),
  parentId: sqliteInteger("parent_id"),
  sortOrder: sqliteInteger("sort_order").notNull().default(0),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const catalogItemsTableSQLite = sqliteTable("catalog_items", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  categoryId: sqliteInteger("category_id").notNull(),
  articleNumber: sqliteText("article_number"),
  name: sqliteText("name").notNull(),
  description: sqliteText("description"),
  productDescription: sqliteText("product_description"),
  unit: sqliteText("unit").notNull().default("Stk"),
  unitPrice: sqliteReal("unit_price").notNull().default(0),
  notes: sqliteText("notes"),
  sortOrder: sqliteInteger("sort_order").notNull().default(0),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`).notNull(),
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
  manufacturer: z.string().optional(),
  productCategoryId: z.number().int().positive().optional().nullable(),
  productInfoTitle: z.string().optional().nullable(),
  productInfoText: z.string().optional().nullable(),
  productDescription: z.string().optional().nullable(),
  quantity: z.coerce.number().positive("Menge muss positiv sein"),
  unit: z.string().min(1, "Einheit ist erforderlich"),
  unitPrice: z.coerce.number(),
  total: z.coerce.number(),
});

export const insertQuoteSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  date: z.string().min(1, "Datum ist erforderlich"),
  validUntil: z.string().optional(),
  projectDescription: z.string().optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  downPaymentPercent: z.coerce.number().min(0).max(100).default(50),
  status: z.enum(["draft", "sent", "accepted", "rejected"]).default("draft"),
  vatRate: z.coerce.number().min(0).max(100).default(19),
  subtotal: z.coerce.number().default(0),
  vatAmount: z.coerce.number().default(0),
  total: z.coerce.number().default(0),
  billingName: z.string().optional().nullable(),
  billingStreet: z.string().optional().nullable(),
  billingZip: z.string().optional().nullable(),
  billingCity: z.string().optional().nullable(),
  items: z.array(documentItemSchema).default([]),
});

export const insertInvoiceSchema = z.object({
  invoiceNumber: z.string().trim().min(1).optional(),
  quoteId: z.number().int().positive().optional().nullable(),
  customerId: z.number().int().positive().optional().nullable(),
  invoiceType: z.enum(["standard", "down_payment", "final"]).default("standard"),
  invoiceGroupNumber: z.string().optional().nullable(),
  installmentIndex: z.number().int().positive().optional().nullable(),
  creditedInvoiceId: z.number().int().positive().optional().nullable(),
  date: z.string().min(1, "Datum ist erforderlich"),
  dueDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  projectDescription: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
  vatRate: z.coerce.number().min(0).max(100).default(19),
  subtotal: z.coerce.number().default(0),
  vatAmount: z.coerce.number().default(0),
  total: z.coerce.number().default(0),
  billingName: z.string().optional().nullable(),
  billingStreet: z.string().optional().nullable(),
  billingZip: z.string().optional().nullable(),
  billingCity: z.string().optional().nullable(),
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
  unitPrice: z.number().default(0),
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

export const insertManufacturerSchema = z.object({
  name: z.string().min(1, "Bezeichnung ist erforderlich"),
  description: z.string().optional(),
  website: z.string().url("Ungültige URL").optional().or(z.literal("")),
  contactInfo: z.string().optional(),
  markupPercent: z.coerce.number().min(0).max(999).default(0),
  sortOrder: z.number().int().default(0),
});

export const insertProductCategorySchema = z.object({
  manufacturerId: z.number().int().positive("Hersteller ist erforderlich"),
  name: z.string().min(1, "Bezeichnung ist erforderlich"),
  description: z.string().optional(),
  productInfoText: z.string().optional(),
  parentId: z.number().int().positive().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const insertCatalogItemSchema = z.object({
  categoryId: z.number().int().positive(),
  articleNumber: z.string().optional(),
  name: z.string().min(1, "Bezeichnung ist erforderlich"),
  description: z.string().optional(),
  productDescription: z.string().optional(),
  unit: z.string().min(1).default("Stk"),
  unitPrice: z.coerce.number().default(0),
  notes: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type InsertManufacturer = z.infer<typeof insertManufacturerSchema>;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type InsertCatalogItem = z.infer<typeof insertCatalogItemSchema>;
export type InsertContactInquiry = z.infer<typeof insertContactInquirySchema>;
export type InsertOfferInquiry = z.infer<typeof insertOfferInquirySchema>;

// ─── Konfigurator-Tabellen ───────────────────────────────────────────────────
// Speichert die Preisraster aus der Excel (Produkt × Breite × Tiefe → Preis)

export const configuratorProductsTable = pgTable("configurator_products", {
  id: serial("id").primaryKey(),
  manufacturerId: integer("manufacturer_id")
    .notNull()
    .references(() => manufacturersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),           // z.B. "Terrassenüberdachung Glas"
  description: text("description"),
  hasWidth: boolean("has_width").notNull().default(true),
  hasDepth: boolean("has_depth").notNull().default(true),
  // Optionale Verknüpfung zur catalog_categories-Kategorie für Verglasung-/Platten-Varianten
  glassVariantCategoryId: integer("glass_variant_category_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Preisraster-Zeilen: eine Zeile pro Breite×Tiefe-Kombination
export const configuratorPricesTable = pgTable("configurator_prices", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => configuratorProductsTable.id, { onDelete: "cascade" }),
  width: numeric("width", { precision: 10, scale: 2 }).notNull(),   // Breite in Metern
  depth: numeric("depth", { precision: 10, scale: 2 }).notNull(),   // Tiefe in Metern
  priceNet: numeric("price_net", { precision: 12, scale: 2 }).notNull(),
  source: text("source"),   // z.B. "APT Preisliste 2025, S.5"
});

// Zubehör-Artikel die optional zum Konfigurator hinzugefügt werden können
export const configuratorAccessoriesTable = pgTable("configurator_accessories", {
  id: serial("id").primaryKey(),
  manufacturerId: integer("manufacturer_id")
    .notNull()
    .references(() => manufacturersTable.id, { onDelete: "cascade" }),
  category: text("category").notNull(),   // z.B. "Aluminiumprofile"
  name: text("name").notNull(),
  priceNet: numeric("price_net", { precision: 12, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("Stk"),   // "pro Meter" | "pro Stück"
  sortOrder: integer("sort_order").notNull().default(0),
});

// ─── SQLite Konfigurator-Tabellen ────────────────────────────────────────────

export const configuratorProductsTableSQLite = sqliteTable("configurator_products", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  manufacturerId: sqliteInteger("manufacturer_id").notNull(),
  name: sqliteText("name").notNull(),
  description: sqliteText("description"),
  hasWidth: sqliteInteger("has_width", { mode: "boolean" }).notNull().default(true),
  hasDepth: sqliteInteger("has_depth", { mode: "boolean" }).notNull().default(true),
  glassVariantCategoryId: sqliteInteger("glass_variant_category_id"),
  sortOrder: sqliteInteger("sort_order").notNull().default(0),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const configuratorPricesTableSQLite = sqliteTable("configurator_prices", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  productId: sqliteInteger("product_id").notNull(),
  width: sqliteReal("width").notNull(),
  depth: sqliteReal("depth").notNull(),
  priceNet: sqliteReal("price_net").notNull(),
  source: sqliteText("source"),
});

export const configuratorAccessoriesTableSQLite = sqliteTable("configurator_accessories", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  manufacturerId: sqliteInteger("manufacturer_id").notNull(),
  category: sqliteText("category").notNull(),
  name: sqliteText("name").notNull(),
  priceNet: sqliteReal("price_net").notNull(),
  unit: sqliteText("unit").notNull().default("Stk"),
  sortOrder: sqliteInteger("sort_order").notNull().default(0),
});

// ─── Hersteller-Farben ───────────────────────────────────────────────────────

export const manufacturerColorsTable = pgTable("manufacturer_colors", {
  id: serial("id").primaryKey(),
  manufacturerId: integer("manufacturer_id")
    .notNull()
    .references(() => manufacturersTable.id, { onDelete: "cascade" }),
  ral: text("ral").notNull(),
  name: text("name").notNull(),
  hex: text("hex").notNull().default("#cccccc"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const manufacturerColorsTableSQLite = sqliteTable("manufacturer_colors", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  manufacturerId: sqliteInteger("manufacturer_id").notNull(),
  ral: sqliteText("ral").notNull(),
  name: sqliteText("name").notNull(),
  hex: sqliteText("hex").notNull().default("#cccccc"),
  sortOrder: sqliteInteger("sort_order").notNull().default(0),
});

export const insertManufacturerColorSchema = z.object({
  manufacturerId: z.number().int().positive(),
  ral: z.string().min(1),
  name: z.string().min(1),
  hex: z.string().default("#cccccc"),
  sortOrder: z.number().int().default(0),
});

export type InsertManufacturerColor = z.infer<typeof insertManufacturerColorSchema>;
