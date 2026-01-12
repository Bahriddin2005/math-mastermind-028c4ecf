
-- Eski chat xabarlariga user_id qo'shish
-- chat_sessions jadvalidagi user_id ni session_id orqali bog'laymiz

UPDATE public.chat_messages cm
SET user_id = cs.user_id
FROM public.chat_sessions cs
WHERE cm.session_id = cs.session_id
  AND cm.user_id IS NULL
  AND cs.user_id IS NOT NULL;
