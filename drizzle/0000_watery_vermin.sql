CREATE TABLE `answer_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor` text NOT NULL,
	`ip` text NOT NULL,
	`day` text NOT NULL,
	`created_at` integer NOT NULL,
	`state` text NOT NULL,
	`signature` text NOT NULL,
	`reserved_micro` integer NOT NULL,
	`actual_micro` integer,
	`answer_json` text,
	`error_code` text,
	`user_day` integer NOT NULL,
	`user_minute` integer NOT NULL,
	`ip_day` integer NOT NULL,
	`ip_minute` integer NOT NULL,
	`site_day` integer NOT NULL,
	`user_concurrency` integer NOT NULL,
	`site_concurrency` integer NOT NULL,
	`budget_micro` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `requests_visitor_time` ON `requests` (`visitor`,`created_at`);--> statement-breakpoint
CREATE INDEX `requests_ip_time` ON `requests` (`ip`,`created_at`);--> statement-breakpoint
CREATE INDEX `requests_day` ON `requests` (`day`);
--> statement-breakpoint
CREATE TRIGGER quota_guard BEFORE INSERT ON requests BEGIN
  SELECT CASE WHEN (SELECT count(*) FROM requests WHERE visitor=NEW.visitor AND day=NEW.day AND state!='refunded') >= NEW.user_day THEN RAISE(ABORT, 'USER_QUOTA_EXCEEDED') END;
  SELECT CASE WHEN (SELECT count(*) FROM requests WHERE visitor=NEW.visitor AND created_at>NEW.created_at-60000 AND state!='refunded') >= NEW.user_minute THEN RAISE(ABORT, 'RATE_LIMITED') END;
  SELECT CASE WHEN (SELECT count(*) FROM requests WHERE ip=NEW.ip AND day=NEW.day AND state!='refunded') >= NEW.ip_day THEN RAISE(ABORT, 'IP_QUOTA_EXCEEDED') END;
  SELECT CASE WHEN (SELECT count(*) FROM requests WHERE ip=NEW.ip AND created_at>NEW.created_at-60000 AND state!='refunded') >= NEW.ip_minute THEN RAISE(ABORT, 'RATE_LIMITED') END;
  SELECT CASE WHEN (SELECT count(*) FROM requests WHERE day=NEW.day AND state!='refunded') >= NEW.site_day THEN RAISE(ABORT, 'SITE_QUOTA_EXCEEDED') END;
  SELECT CASE WHEN (SELECT count(*) FROM requests WHERE visitor=NEW.visitor AND state='reserved' AND created_at>NEW.created_at-90000) >= NEW.user_concurrency THEN RAISE(ABORT, 'CONCURRENCY_LIMITED') END;
  SELECT CASE WHEN (SELECT count(*) FROM requests WHERE state='reserved' AND created_at>NEW.created_at-90000) >= NEW.site_concurrency THEN RAISE(ABORT, 'CONCURRENCY_LIMITED') END;
  SELECT CASE WHEN COALESCE((SELECT sum(CASE WHEN state='settled' THEN actual_micro ELSE reserved_micro END) FROM requests WHERE day=NEW.day AND state!='refunded'),0)+NEW.reserved_micro > NEW.budget_micro THEN RAISE(ABORT, 'SITE_BUDGET_EXCEEDED') END;
END;
