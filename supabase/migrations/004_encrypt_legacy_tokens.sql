-- =============================================================================
-- 004 — Re-wrap legacy plaintext tokens with the enc: prefix
-- Run once. Idempotent: any token not starting with 'enc:' is treated as legacy
-- plaintext and re-encrypted in place using the application key. The previous
-- cipher format (raw base64) is therefore replaced.
-- =============================================================================

do $$
declare
  r record;
  v_plain text;
  v_cipher text;
  v_count int := 0;
begin
  for r in
    select id, hf_token, vercel_token, github_token, docker_token, gitlab_token, netlify_token, llm_api_key
    from user_settings
  loop
    v_plain := null;

    if r.hf_token is not null and r.hf_token <> '' and r.hf_token not like 'enc:%' then
      v_plain := r.hf_token;
    end if;

    if v_plain is null and r.llm_api_key is not null and r.llm_api_key <> '' and r.llm_api_key not like 'enc:%' then
      v_plain := r.llm_api_key;
    end if;

    if v_plain is not null then
      v_cipher := 'enc:' || encode(pgp_sym_encrypt(v_plain, current_setting('app.settings.bridge_token_key', true)), 'base64');
      update user_settings
        set hf_token = case when hf_token not like 'enc:%' and hf_token <> '' then v_cipher else hf_token end,
            vercel_token = case when vercel_token not like 'enc:%' and vercel_token <> '' then v_cipher else vercel_token end,
            github_token = case when github_token not like 'enc:%' and github_token <> '' then v_cipher else github_token end,
            docker_token = case when docker_token not like 'enc:%' and docker_token <> '' then v_cipher else docker_token end,
            gitlab_token = case when gitlab_token not like 'enc:%' and gitlab_token <> '' then v_cipher else gitlab_token end,
            netlify_token = case when netlify_token not like 'enc:%' and netlify_token <> '' then v_cipher else netlify_token end,
            llm_api_key = case when llm_api_key not like 'enc:%' and llm_api_key <> '' then v_cipher else llm_api_key end
      where id = r.id;
      v_count := v_count + 1;
    end if;
  end loop;

  raise notice 'Re-encrypted % user_settings row(s).', v_count;
end $$;
