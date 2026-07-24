ALTER TABLE public.org_settings RENAME COLUMN slack_webhook_url TO discord_webhook_url;
ALTER TABLE public.org_settings ADD COLUMN IF NOT EXISTS notify_email text;