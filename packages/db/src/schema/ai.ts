import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const aiGatewaySettings = sqliteTable("ai_gateway_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  apiKey: text("api_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const transcripts = sqliteTable(
  "transcripts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    blobPathname: text("blob_pathname").notNull(),
    blobUrl: text("blob_url").notNull(),
    contentType: text("content_type"),
    sizeBytes: integer("size_bytes"),
    transcriptText: text("transcript_text").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("transcripts_userId_createdAt_idx").on(table.userId, table.createdAt),
    uniqueIndex("transcripts_blobPathname_idx").on(table.blobPathname),
  ],
);

export const systemPromptVersions = sqliteTable(
  "system_prompt_versions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("system_prompt_versions_userId_createdAt_idx").on(table.userId, table.createdAt),
    index("system_prompt_versions_userId_title_idx").on(table.userId, table.title),
  ],
);

export const analyses = sqliteTable(
  "analyses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    transcriptId: text("transcript_id")
      .notNull()
      .references(() => transcripts.id, { onDelete: "cascade" }),
    promptVersionId: text("prompt_version_id")
      .notNull()
      .references(() => systemPromptVersions.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    modelId: text("model_id").notNull(),
    providerName: text("provider_name"),
    temperatureMilli: integer("temperature_milli"),
    topPMilli: integer("top_p_milli"),
    maxOutputTokens: integer("max_output_tokens"),
    settingsJson: text("settings_json"),
    promptTitleSnapshot: text("prompt_title_snapshot").notNull(),
    promptTextSnapshot: text("prompt_text_snapshot").notNull(),
    transcriptFileNameSnapshot: text("transcript_file_name_snapshot").notNull(),
    resultText: text("result_text"),
    errorMessage: text("error_message"),
    generationId: text("generation_id"),
    finishReason: text("finish_reason"),
    streamed: integer("streamed", { mode: "boolean" }).default(true).notNull(),
    totalCostMicros: integer("total_cost_micros"),
    usageMicros: integer("usage_micros"),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    reasoningTokens: integer("reasoning_tokens"),
    cachedTokens: integer("cached_tokens"),
    cacheCreationTokens: integer("cache_creation_tokens"),
    latencyMs: integer("latency_ms"),
    generationTimeMs: integer("generation_time_ms"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("analyses_userId_createdAt_idx").on(table.userId, table.createdAt),
    index("analyses_transcriptId_idx").on(table.transcriptId),
    index("analyses_promptVersionId_idx").on(table.promptVersionId),
    index("analyses_modelId_idx").on(table.modelId),
    uniqueIndex("analyses_generationId_idx").on(table.generationId),
  ],
);

export const analysisScores = sqliteTable(
  "analysis_scores",
  {
    analysisId: text("analysis_id")
      .primaryKey()
      .references(() => analyses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("analysis_scores_userId_score_idx").on(table.userId, table.score)],
);

export const aiGatewaySettingsRelations = relations(aiGatewaySettings, ({ one }) => ({
  user: one(user, {
    fields: [aiGatewaySettings.userId],
    references: [user.id],
  }),
}));

export const transcriptsRelations = relations(transcripts, ({ many, one }) => ({
  user: one(user, {
    fields: [transcripts.userId],
    references: [user.id],
  }),
  analyses: many(analyses),
}));

export const systemPromptVersionsRelations = relations(systemPromptVersions, ({ many, one }) => ({
  user: one(user, {
    fields: [systemPromptVersions.userId],
    references: [user.id],
  }),
  analyses: many(analyses),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  user: one(user, {
    fields: [analyses.userId],
    references: [user.id],
  }),
  transcript: one(transcripts, {
    fields: [analyses.transcriptId],
    references: [transcripts.id],
  }),
  promptVersion: one(systemPromptVersions, {
    fields: [analyses.promptVersionId],
    references: [systemPromptVersions.id],
  }),
  score: one(analysisScores, {
    fields: [analyses.id],
    references: [analysisScores.analysisId],
  }),
}));

export const analysisScoresRelations = relations(analysisScores, ({ one }) => ({
  analysis: one(analyses, {
    fields: [analysisScores.analysisId],
    references: [analyses.id],
  }),
  user: one(user, {
    fields: [analysisScores.userId],
    references: [user.id],
  }),
}));
