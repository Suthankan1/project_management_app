-- Legacy project GitHub integrations could contain browser-submitted tokens.
-- New links use the authenticated user's encrypted server-side OAuth token.
UPDATE github_integrations
SET encrypted_access_token = NULL
WHERE encrypted_access_token IS NOT NULL;
