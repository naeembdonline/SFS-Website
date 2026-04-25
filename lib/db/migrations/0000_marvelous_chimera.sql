-- Enable citext extension (required for case-insensitive email column on users table)
CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
CREATE TYPE "public"."campaign_lifecycle" AS ENUM('active', 'past');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."locale_t" AS ENUM('bn', 'en', 'ar');--> statement-breakpoint
CREATE TYPE "public"."nav_link_kind" AS ENUM('route', 'external');--> statement-breakpoint
CREATE TYPE "public"."nav_menu" AS ENUM('header', 'footer');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('blog', 'news');--> statement-breakpoint
CREATE TYPE "public"."resource_kind" AS ENUM('pdf', 'link', 'doc');--> statement-breakpoint
CREATE TYPE "public"."submission_kind" AS ENUM('contact', 'advisory');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('new', 'reviewed', 'handled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'editor');--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_ip" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "totp_recovery_codes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" "citext" NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"display_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"totp_secret_encrypted" "bytea",
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"storage_key" text NOT NULL,
	"bucket" text NOT NULL,
	"original_filename" text,
	"mime" text NOT NULL,
	"bytes" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"checksum_sha256" text,
	"uploaded_by_user_id" bigint NOT NULL,
	"variants" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "media_translations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"media_id" bigint NOT NULL,
	"locale" "locale_t" NOT NULL,
	"alt_text" text,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_translations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"campaign_id" bigint NOT NULL,
	"locale" "locale_t" NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"body" text NOT NULL,
	"goals" text,
	"seo_title" text,
	"meta_description" text,
	"og_title" text,
	"og_description" text,
	"og_image_id" bigint,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"status_lifecycle" "campaign_lifecycle" DEFAULT 'active' NOT NULL,
	"cover_media_id" bigint,
	"start_date" date,
	"end_date" date,
	"first_published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leadership" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"photo_media_id" bigint,
	"display_order" bigint DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leadership_translations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"leadership_id" bigint NOT NULL,
	"locale" "locale_t" NOT NULL,
	"name" text NOT NULL,
	"role_title" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_translations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"page_id" bigint NOT NULL,
	"locale" "locale_t" NOT NULL,
	"title" text NOT NULL,
	"slug" text,
	"body" text,
	"sections" jsonb,
	"seo_title" text,
	"meta_description" text,
	"og_title" text,
	"og_description" text,
	"og_image_id" bigint,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "post_translations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"post_id" bigint NOT NULL,
	"locale" "locale_t" NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"body" text NOT NULL,
	"seo_title" text,
	"meta_description" text,
	"og_title" text,
	"og_description" text,
	"og_image_id" bigint,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"type" "post_type" NOT NULL,
	"cover_media_id" bigint,
	"author_user_id" bigint,
	"first_published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_translations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"resource_id" bigint NOT NULL,
	"locale" "locale_t" NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"seo_title" text,
	"meta_description" text,
	"og_title" text,
	"og_description" text,
	"og_image_id" bigint,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kind" "resource_kind" NOT NULL,
	"file_media_id" bigint,
	"external_url" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigation_item_translations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"navigation_item_id" bigint NOT NULL,
	"locale" "locale_t" NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigation_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"menu" "nav_menu" NOT NULL,
	"parent_id" bigint,
	"display_order" integer DEFAULT 0 NOT NULL,
	"link_kind" "nav_link_kind" NOT NULL,
	"route_key" text,
	"external_url" text,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nav_items_link_check" CHECK ((link_kind = 'route' AND route_key IS NOT NULL AND external_url IS NULL)
          OR (link_kind = 'external' AND external_url IS NOT NULL AND route_key IS NULL))
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"logo_media_id" bigint,
	"default_og_image_id" bigint,
	"contact_email" text,
	"contact_phone" text,
	"address" text,
	"socials" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton" CHECK (id = 1)
);
--> statement-breakpoint
CREATE TABLE "site_settings_translations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"locale" "locale_t" NOT NULL,
	"site_name" text NOT NULL,
	"tagline" text,
	"footer_text" text,
	"default_meta_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_translations_locale_unique" UNIQUE("locale")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"request_id" text NOT NULL,
	"actor_user_id" bigint,
	"actor_role" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" bigint,
	"locale_affected" "locale_t",
	"diff" jsonb,
	"ip" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"bucket" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slug_redirects" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"locale" "locale_t" NOT NULL,
	"old_slug" text NOT NULL,
	"entity_id" bigint NOT NULL,
	"created_by_user_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slug_reservations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"locale" "locale_t" NOT NULL,
	"slug" text NOT NULL,
	"entity_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kind" "submission_kind" NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"locale" "locale_t",
	"status" "submission_status" DEFAULT 'new' NOT NULL,
	"ip" "inet",
	"user_agent" text,
	"admin_notes" text,
	"handled_at" timestamp with time zone,
	"handled_by_user_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "totp_recovery_codes" ADD CONSTRAINT "totp_recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_translations" ADD CONSTRAINT "media_translations_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_translations" ADD CONSTRAINT "campaign_translations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_translations" ADD CONSTRAINT "campaign_translations_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadership" ADD CONSTRAINT "leadership_photo_media_id_media_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadership_translations" ADD CONSTRAINT "leadership_translations_leadership_id_leadership_id_fk" FOREIGN KEY ("leadership_id") REFERENCES "public"."leadership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_translations" ADD CONSTRAINT "page_translations_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_translations" ADD CONSTRAINT "page_translations_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_translations" ADD CONSTRAINT "post_translations_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_translations" ADD CONSTRAINT "post_translations_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_translations" ADD CONSTRAINT "resource_translations_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_translations" ADD CONSTRAINT "resource_translations_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_file_media_id_media_id_fk" FOREIGN KEY ("file_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigation_item_translations" ADD CONSTRAINT "navigation_item_translations_navigation_item_id_navigation_items_id_fk" FOREIGN KEY ("navigation_item_id") REFERENCES "public"."navigation_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_media_id_media_id_fk" FOREIGN KEY ("logo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_og_image_id_media_id_fk" FOREIGN KEY ("default_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slug_redirects" ADD CONSTRAINT "slug_redirects_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_handled_by_user_id_users_id_fk" FOREIGN KEY ("handled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "prt_token_hash_idx" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "prt_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prt_expires_at_idx" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "totp_rc_user_id_idx" ON "totp_recovery_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "totp_rc_user_unused_idx" ON "totp_recovery_codes" USING btree ("user_id","used_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "media_storage_key_idx" ON "media" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "media_uploader_idx" ON "media" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "media_mime_idx" ON "media" USING btree ("mime");--> statement-breakpoint
CREATE UNIQUE INDEX "media_translations_media_locale_idx" ON "media_translations" USING btree ("media_id","locale");--> statement-breakpoint
CREATE INDEX "media_translations_media_id_idx" ON "media_translations" USING btree ("media_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_translations_campaign_locale_idx" ON "campaign_translations" USING btree ("campaign_id","locale");--> statement-breakpoint
CREATE INDEX "campaign_translations_locale_status_date_idx" ON "campaign_translations" USING btree ("locale","status","published_at");--> statement-breakpoint
CREATE INDEX "campaign_translations_locale_slug_idx" ON "campaign_translations" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "campaign_translations_campaign_id_idx" ON "campaign_translations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaigns_lifecycle_idx" ON "campaigns" USING btree ("status_lifecycle");--> statement-breakpoint
CREATE INDEX "campaigns_active_idx" ON "campaigns" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "campaigns_first_published_at_idx" ON "campaigns" USING btree ("first_published_at");--> statement-breakpoint
CREATE INDEX "leadership_order_idx" ON "leadership" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "leadership_visible_idx" ON "leadership" USING btree ("is_visible");--> statement-breakpoint
CREATE INDEX "leadership_active_idx" ON "leadership" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leadership_translations_member_locale_idx" ON "leadership_translations" USING btree ("leadership_id","locale");--> statement-breakpoint
CREATE INDEX "leadership_translations_leadership_id_idx" ON "leadership_translations" USING btree ("leadership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "page_translations_page_locale_idx" ON "page_translations" USING btree ("page_id","locale");--> statement-breakpoint
CREATE INDEX "page_translations_locale_status_idx" ON "page_translations" USING btree ("locale","status");--> statement-breakpoint
CREATE INDEX "page_translations_locale_slug_idx" ON "page_translations" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "page_translations_page_id_idx" ON "page_translations" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_key_idx" ON "pages" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "post_translations_post_locale_idx" ON "post_translations" USING btree ("post_id","locale");--> statement-breakpoint
CREATE INDEX "post_translations_locale_status_date_idx" ON "post_translations" USING btree ("locale","status","published_at");--> statement-breakpoint
CREATE INDEX "post_translations_post_id_idx" ON "post_translations" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_translations_locale_slug_idx" ON "post_translations" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "posts_type_idx" ON "posts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "posts_first_published_at_idx" ON "posts" USING btree ("first_published_at");--> statement-breakpoint
CREATE INDEX "posts_active_idx" ON "posts" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_translations_resource_locale_idx" ON "resource_translations" USING btree ("resource_id","locale");--> statement-breakpoint
CREATE INDEX "resource_translations_locale_status_date_idx" ON "resource_translations" USING btree ("locale","status","published_at");--> statement-breakpoint
CREATE INDEX "resource_translations_locale_slug_idx" ON "resource_translations" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "resource_translations_resource_id_idx" ON "resource_translations" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "resources_kind_idx" ON "resources" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "resources_active_idx" ON "resources" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "nav_item_translations_item_locale_idx" ON "navigation_item_translations" USING btree ("navigation_item_id","locale");--> statement-breakpoint
CREATE INDEX "nav_item_translations_item_id_idx" ON "navigation_item_translations" USING btree ("navigation_item_id");--> statement-breakpoint
CREATE INDEX "nav_items_menu_order_idx" ON "navigation_items" USING btree ("menu","display_order");--> statement-breakpoint
CREATE INDEX "nav_items_parent_id_idx" ON "navigation_items" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "site_settings_translations_locale_idx" ON "site_settings_translations" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "audit_log_at_desc_idx" ON "audit_log" USING btree ("at");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id","at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_user_id","at");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action","at");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limits_bucket_window_idx" ON "rate_limits" USING btree ("bucket","window_start");--> statement-breakpoint
CREATE INDEX "rate_limits_bucket_idx" ON "rate_limits" USING btree ("bucket","window_start");--> statement-breakpoint
CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE UNIQUE INDEX "slug_redirects_type_locale_old_slug_idx" ON "slug_redirects" USING btree ("entity_type","locale","old_slug");--> statement-breakpoint
CREATE INDEX "slug_redirects_entity_id_idx" ON "slug_redirects" USING btree ("entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "slug_reservations_type_locale_slug_idx" ON "slug_reservations" USING btree ("entity_type","locale","slug");--> statement-breakpoint
CREATE INDEX "slug_reservations_entity_idx" ON "slug_reservations" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "submissions_status_created_at_idx" ON "submissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "submissions_kind_status_idx" ON "submissions" USING btree ("kind","status");--> statement-breakpoint
CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");