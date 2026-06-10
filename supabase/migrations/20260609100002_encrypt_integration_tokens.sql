-- Sprint 4.1 — Encrypt OAuth tokens in user_integrations via pgcrypto + Supabase Vault
--
-- Strategy:
--   1. Base table renamed to _user_integrations; token columns renamed to *_enc.
--   2. A lightweight view public.user_integrations exposes non-sensitive columns
--      (provider, scopes, metadata, timestamps) and supports DELETE transparently.
--   3. Three SECURITY DEFINER RPCs replace direct token reads/writes:
--        get_integration_tokens()          — decrypts on read
--        upsert_integration()              — encrypts on write
--        update_integration_access_token() — encrypts on write
--   4. encrypt_token / decrypt_token are REVOKE'd from public; only service_role
--      can execute them (called internally by the RPCs).

-- 1. Enable pgcrypto (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Store a random 256-bit key in Vault (generated once; skipped if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'token_enc_key') THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'token_enc_key',
      'AES key used by pgp_sym_encrypt for user_integrations OAuth tokens'
    );
  END IF;
END;
$$;

-- 3a. Symmetric encrypt: plaintext → base64(pgp_sym_encrypt(plain, key))
CREATE OR REPLACE FUNCTION public.encrypt_token(plain text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  k text;
BEGIN
  IF plain IS NULL THEN RETURN NULL; END IF;
  SELECT decrypted_secret INTO k FROM vault.decrypted_secrets WHERE name = 'token_enc_key';
  RETURN encode(pgp_sym_encrypt(plain, k), 'base64');
END;
$$;
REVOKE ALL ON FUNCTION public.encrypt_token(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.encrypt_token(text) TO service_role;

-- 3b. Symmetric decrypt: base64(ciphertext) → plaintext
CREATE OR REPLACE FUNCTION public.decrypt_token(enc text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  k text;
BEGIN
  IF enc IS NULL THEN RETURN NULL; END IF;
  SELECT decrypted_secret INTO k FROM vault.decrypted_secrets WHERE name = 'token_enc_key';
  RETURN pgp_sym_decrypt(decode(enc, 'base64'), k);
END;
$$;
REVOKE ALL ON FUNCTION public.decrypt_token(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.decrypt_token(text) TO service_role;

-- 4. Rename base table and its plaintext token columns
ALTER TABLE public.user_integrations  RENAME TO _user_integrations;
ALTER TABLE public._user_integrations RENAME COLUMN access_token  TO access_token_enc;
ALTER TABLE public._user_integrations RENAME COLUMN refresh_token TO refresh_token_enc;

-- 5. Encrypt any existing plaintext values in-place (no-op if already encrypted or NULL)
UPDATE public._user_integrations
SET
  access_token_enc  = public.encrypt_token(access_token_enc),
  refresh_token_enc = public.encrypt_token(refresh_token_enc)
WHERE access_token_enc  IS NOT NULL
   OR refresh_token_enc IS NOT NULL;

-- 6. Public view — exposes non-sensitive columns only; supports DELETE via trigger
CREATE OR REPLACE VIEW public.user_integrations
WITH (security_invoker = false)
AS
SELECT
  id,
  user_id,
  provider,
  token_expires_at,
  scopes,
  metadata,
  created_at,
  updated_at
FROM public._user_integrations;

GRANT SELECT, DELETE ON public.user_integrations TO service_role;
GRANT SELECT         ON public.user_integrations TO authenticated;

-- 6a. INSTEAD OF DELETE so Edge Function ".delete()" passes through the view
CREATE OR REPLACE FUNCTION public.trg_user_integrations_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public._user_integrations WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_ui_delete
  INSTEAD OF DELETE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION public.trg_user_integrations_delete();

-- 7. RPC: read decrypted tokens (service_role only)
CREATE OR REPLACE FUNCTION public.get_integration_tokens(
  p_user_id  uuid,
  p_provider text
)
RETURNS TABLE(
  id               uuid,
  access_token     text,
  refresh_token    text,
  token_expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    public.decrypt_token(t.access_token_enc),
    public.decrypt_token(t.refresh_token_enc),
    t.token_expires_at
  FROM public._user_integrations t
  WHERE t.user_id = p_user_id AND t.provider = p_provider;
END;
$$;
REVOKE ALL ON FUNCTION public.get_integration_tokens(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_integration_tokens(uuid, text) TO service_role;

-- 8. RPC: upsert full integration row with encrypted tokens
CREATE OR REPLACE FUNCTION public.upsert_integration(
  p_user_id       uuid,
  p_provider      text,
  p_access_token  text,
  p_refresh_token text,
  p_expires_at    timestamptz,
  p_scopes        text  DEFAULT NULL,
  p_metadata      jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public._user_integrations
    (user_id, provider, access_token_enc, refresh_token_enc, token_expires_at, scopes, metadata)
  VALUES (
    p_user_id,
    p_provider,
    public.encrypt_token(p_access_token),
    public.encrypt_token(p_refresh_token),
    p_expires_at,
    p_scopes,
    COALESCE(p_metadata, '{}')
  )
  ON CONFLICT (user_id, provider) DO UPDATE SET
    access_token_enc  = EXCLUDED.access_token_enc,
    -- Preserve existing refresh_token if not being replaced (NULL means "not provided")
    refresh_token_enc = COALESCE(EXCLUDED.refresh_token_enc, _user_integrations.refresh_token_enc),
    token_expires_at  = EXCLUDED.token_expires_at,
    scopes            = COALESCE(EXCLUDED.scopes,    _user_integrations.scopes),
    metadata          = COALESCE(EXCLUDED.metadata,  _user_integrations.metadata);
END;
$$;
REVOKE ALL ON FUNCTION public.upsert_integration(uuid, text, text, text, timestamptz, text, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.upsert_integration(uuid, text, text, text, timestamptz, text, jsonb) TO service_role;

-- 9. RPC: update access_token after OAuth refresh (refresh_token unchanged)
CREATE OR REPLACE FUNCTION public.update_integration_access_token(
  p_user_id      uuid,
  p_provider     text,
  p_access_token text,
  p_expires_at   timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public._user_integrations
  SET
    access_token_enc = public.encrypt_token(p_access_token),
    token_expires_at = p_expires_at
  WHERE user_id = p_user_id AND provider = p_provider;
END;
$$;
REVOKE ALL ON FUNCTION public.update_integration_access_token(uuid, text, text, timestamptz) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.update_integration_access_token(uuid, text, text, timestamptz) TO service_role;
