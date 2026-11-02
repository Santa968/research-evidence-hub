import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const requests = sqliteTable("requests", {
  id: text("id").primaryKey(), visitor: text("visitor").notNull(), ip: text("ip").notNull(), day: text("day").notNull(),
  createdAt: integer("created_at").notNull(), state: text("state").notNull(), signature: text("signature").notNull(),
  reservedMicro: integer("reserved_micro").notNull(), actualMicro: integer("actual_micro"), answerJson: text("answer_json"), errorCode: text("error_code"),
  model:text("model"),inputTokens:integer("input_tokens"),outputTokens:integer("output_tokens"),
  userDay: integer("user_day").notNull(), userMinute: integer("user_minute").notNull(), ipDay: integer("ip_day").notNull(), ipMinute: integer("ip_minute").notNull(),
  siteDay: integer("site_day").notNull(), userConcurrency: integer("user_concurrency").notNull(), siteConcurrency: integer("site_concurrency").notNull(), budgetMicro: integer("budget_micro").notNull(),
}, t=>[index("requests_visitor_time").on(t.visitor,t.createdAt),index("requests_ip_time").on(t.ip,t.createdAt),index("requests_day").on(t.day)]);

export const answerCache = sqliteTable("answer_cache", {key:text("key").primaryKey(), value:text("value").notNull(), expiresAt:integer("expires_at").notNull()});
