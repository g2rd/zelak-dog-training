// supabase/functions/video-url/index.ts
//
// Wydaje podpisany, ważny 2 godziny link do odtwarzacza Bunny Stream.
// O tym, czy użytkownik widzi dane zadanie, decyduje RLS na tabeli `tasks`
// (zapytanie idzie z tokenem użytkownika). Brak wiersza = brak dostępu = 403.
//
// Sekrety: BUNNY_LIBRARY_ID, BUNNY_TOKEN_KEY (Stream Library → Security →
// Token Authentication), SITE_URL.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json, text } from "../_shared/cors.ts";

const TTL_SECONDS = 2 * 3600;

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return text(req, "Method not allowed", 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
    },
  );

  let taskId: string | undefined;
  try {
    ({ taskId } = await req.json());
  } catch {
    return text(req, "Bad request", 400);
  }
  if (!taskId) return text(req, "Bad request", 400);

  const { data: task } = await supabase
    .from("tasks")
    .select("bunny_video_id")
    .eq("id", taskId)
    .maybeSingle();

  if (!task?.bunny_video_id) return text(req, "Forbidden", 403);

  const libraryId = Deno.env.get("BUNNY_LIBRARY_ID")!;
  const expires = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const token = await sha256Hex(
    Deno.env.get("BUNNY_TOKEN_KEY")! + task.bunny_video_id + expires,
  );

  const url =
    `https://iframe.mediadelivery.net/embed/${libraryId}/${task.bunny_video_id}` +
    `?token=${token}&expires=${expires}&autoplay=false&preload=false&responsive=true`;

  return json(req, { url, expires });
});
