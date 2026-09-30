// supabase/functions/notify-trainer/index.ts
//
// Mail do trenera o zdarzeniu w strefie. Wywołuje ją WYŁĄCZNIE baza
// (wyzwalacze z migracji 20260924150000 przez pg_net), nigdy przeglądarka.
//
// Autoryzacja: nagłówek `x-notify-secret` musi być równy sekretowi
// NOTIFY_SECRET. JWT jest wyłączone (`verify_jwt = false`), bo baza nie ma
// tokenu użytkownika — tak samo jak kiedyś webhook płatności.
//
// Wyzwalacz przysyła tylko { event, id }. Dane doczytujemy tutaj kluczem
// service_role, więc treść maila zmienia się w jednym pliku.
//
// Sekrety: RESEND_API_KEY, NOTIFY_SECRET, SITE_URL; opcjonalnie NOTIFY_TO
// (domyślnie kontakt@zelak.pl).
import { createClient } from 'npm:@supabase/supabase-js@2'

const TO = Deno.env.get('NOTIFY_TO') ?? 'kontakt@zelak.pl'
// Osobny adres nadawcy: z `kontakt@zelak.pl` (czyli do samego siebie)
// program pocztowy pokazuje nadawcę jako „ja” i wszystkie maile wyglądają
// tak samo. Tu nazwa nadawcy mówi od razu, o co chodzi. Skrzynki pod tym
// adresem nie ma — „Odpowiedz” idzie na `replyTo` (kursant albo kontakt@).
const FROM_ADDRESS = 'powiadomienia@zelak.pl'
const SITE = Deno.env.get('SITE_URL') ?? 'https://zelak.pl'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

type Mail = {
  sender: string // nazwa nadawcy w skrzynce, np. „Karolina · nowy pies Saszka”
  subject: string
  rows: [string, string | null | undefined][]
  link?: [string, string]
  photo?: string | null
  body?: string
  replyTo?: string | null
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'long', timeStyle: 'short' }) : null

const fmtDay = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'long' }) : null

/** Wiek psa słownie: „4 mies.”, „2 lata 3 mies.”. */
function age(birth?: string | null) {
  if (!birth) return null
  const b = new Date(birth)
  const now = new Date()
  const months = (now.getFullYear() - b.getFullYear()) * 12 + now.getMonth() - b.getMonth() - (now.getDate() < b.getDate() ? 1 : 0)
  if (months < 0) return null
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y ? `${y} ${y === 1 ? 'rok' : y < 5 ? 'lata' : 'lat'}` : '', m || !y ? `${m} mies.` : ''].filter(Boolean).join(' ')
}

async function profile(userId: string) {
  const { data } = await admin.from('profiles').select('full_name, email, created_at').eq('id', userId).maybeSingle()
  return data
}

/** Link do zdjęcia ważny tydzień — tyle, ile mail ma sens w skrzynce. */
async function photoUrl(path?: string | null) {
  if (!path) return null
  const { data } = await admin.storage.from('psy').createSignedUrl(path, 7 * 24 * 3600)
  return data?.signedUrl ?? null
}

const who = (p: { full_name?: string | null; email?: string | null } | null) =>
  p ? `${p.full_name || 'bez imienia'} (${p.email})` : 'nieznany użytkownik'

/** Krótko do nazwy nadawcy: imię, a bez imienia początek adresu e-mail. */
const nick = (p: { full_name?: string | null; email?: string | null } | null) =>
  p?.full_name?.trim() || p?.email?.split('@')[0] || 'Ktoś'

/** Nazwa nadawcy bez znaków, które psują nagłówek From. */
const senderName = (s: string) => s.replace(/["<>\r\n]/g, '').slice(0, 70)

async function build(event: string, id: string): Promise<Mail | null> {
  switch (event) {
    case 'new_account': {
      const p = await profile(id)
      if (!p) return null
      return {
        sender: `Nowe konto: ${nick(p)}`,
        subject: `Nowy użytkownik ${nick(p)} (${p.email}) założył konto`,
        replyTo: p.email,
        rows: [
          ['Imię', p.full_name || '—'],
          ['E-mail', p.email],
          ['Założone', fmtDate(p.created_at)],
        ],
        body: 'Konto czeka na potwierdzenie adresu e-mail przez właściciela. W panelu trenera, w sekcji „Konta bez dostępu”, utworzysz dla tej osoby kod jednym kliknięciem.',
        link: ['Otwórz w panelu trenera', `${SITE}/trener`],
      }
    }
    case 'new_dog': {
      const { data: d } = await admin.from('dogs').select('name, breed, birth_date, photo_path, user_id').eq('id', id).maybeSingle()
      if (!d) return null
      const owner = await profile(d.user_id)
      return {
        sender: `${nick(owner)} · nowy pies ${d.name}`,
        subject: `${nick(owner)} dodaje nowego psa: ${d.name}${d.breed ? ` (${d.breed})` : ''}`,
        replyTo: owner?.email,
        rows: [
          ['Pies', d.name],
          ['Rasa', d.breed],
          ['Wiek', age(d.birth_date)],
          ['Właściciel', who(owner)],
        ],
        photo: await photoUrl(d.photo_path),
        link: ['Otwórz w panelu trenera', `${SITE}/trener`],
      }
    }
    case 'application': {
      const { data: a } = await admin
        .from('participants')
        .select('id, user_id, applied_at, dogs(name, breed, birth_date, photo_path), programs(title)')
        .eq('id', id)
        .maybeSingle()
      if (!a) return null
      const dog = a.dogs as { name: string; breed: string | null; birth_date: string | null; photo_path: string | null } | null
      const owner = await profile(a.user_id)
      const plan = (a.programs as { title: string } | null)?.title ?? 'plan'
      return {
        sender: `${nick(owner)} · prośba o dostęp`,
        subject: `${nick(owner)} prosi o dostęp do planu ${plan} dla psa ${dog?.name ?? ''}`.trim(),
        replyTo: owner?.email,
        rows: [
          ['Pies', dog?.name],
          ['Rasa', dog?.breed],
          ['Wiek', age(dog?.birth_date)],
          ['Właściciel', who(owner)],
          ['Zgłoszenie', fmtDate(a.applied_at)],
        ],
        photo: await photoUrl(dog?.photo_path),
        link: ['Otwórz w panelu trenera', `${SITE}/trener`],
      }
    }
    case 'code_redeemed': {
      const { data: c } = await admin
        .from('access_codes')
        .select('code, email, note, redeemed_at, redeemed_by, participant_id')
        .eq('id', id)
        .maybeSingle()
      if (!c) return null
      const { data: part } = c.participant_id
        ? await admin.from('participants').select('expires_at, dogs(name, photo_path)').eq('id', c.participant_id).maybeSingle()
        : { data: null }
      const dog = part?.dogs as { name: string; photo_path: string | null } | null
      const user = c.redeemed_by ? await profile(c.redeemed_by) : null
      const kod = `${c.code.slice(0, 4)}-${c.code.slice(4)}`
      return {
        sender: `${nick(user)} · kod użyty`,
        subject: `${nick(user)} wpisuje kod ${kod}${dog ? ` — dostęp dla psa ${dog.name}` : ''}`,
        replyTo: user?.email,
        rows: [
          ['Kod', kod],
          ['Notatka', c.note],
          ['Kto', user ? who(user) : null],
          ['Pies', dog?.name],
          ['Dostęp do', fmtDay(part?.expires_at) ?? 'bez limitu'],
        ],
        photo: await photoUrl(dog?.photo_path),
        link: c.participant_id ? ['Zobacz kursanta', `${SITE}/trener/kursant/${c.participant_id}`] : undefined,
      }
    }
    case 'message': {
      const { data: m } = await admin
        .from('messages')
        .select('body, created_at, participant_id, author_id, participants(dogs(name))')
        .eq('id', id)
        .maybeSingle()
      if (!m) return null
      const dogName = ((m.participants as { dogs: { name: string } | null } | null)?.dogs)?.name
      const author = m.author_id ? await profile(m.author_id) : null
      return {
        sender: `${nick(author)} · wiadomość`,
        subject: `${nick(author)} pisze${dogName ? ` (pies ${dogName})` : ''}: ${m.body.slice(0, 60)}${m.body.length > 60 ? '…' : ''}`,
        replyTo: author?.email,
        rows: [
          ['Od', author ? who(author) : null],
          ['Pies', dogName],
          ['Wysłana', fmtDate(m.created_at)],
        ],
        body: m.body,
        link: ['Odpowiedz w panelu', `${SITE}/trener/kursant/${m.participant_id}`],
      }
    }
  }
  return null
}

function html(mail: Mail) {
  const rows = mail.rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#666">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`)
    .join('')
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111;max-width:560px">
<h2 style="font-size:18px;margin:0 0 16px">${esc(mail.subject)}</h2>
${mail.photo ? `<img src="${esc(mail.photo)}" alt="" width="160" style="border-radius:8px;margin:0 0 16px;display:block">` : ''}
<table style="border-collapse:collapse">${rows}</table>
${mail.body ? `<p style="white-space:pre-line;margin:16px 0;padding:12px;background:#f4f4f4;border-radius:6px">${esc(mail.body)}</p>` : ''}
${mail.link ? `<p style="margin:20px 0"><a href="${esc(mail.link[1])}" style="background:#111;color:#fff;padding:10px 18px;border-radius:4px;text-decoration:none">${esc(mail.link[0])}</a></p>` : ''}
<p style="color:#999;font-size:12px;margin-top:24px">Powiadomienie ze strefy kursów zelak.pl</p>
</div>`
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const secret = Deno.env.get('NOTIFY_SECRET')
  if (!secret || req.headers.get('x-notify-secret') !== secret) {
    return new Response('Forbidden', { status: 403 })
  }

  let event: string, id: string
  try {
    ;({ event, id } = await req.json())
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const mail = await build(event, id)
  // Wiersz mógł zniknąć między wyzwalaczem a wywołaniem (np. usunięte konto).
  if (!mail) return new Response('skipped', { status: 200 })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `"${senderName(mail.sender)}" <${FROM_ADDRESS}>`,
      to: [TO],
      reply_to: mail.replyTo || TO,
      subject: mail.subject,
      html: html(mail),
    }),
  })
  if (!res.ok) {
    console.error('Resend', res.status, await res.text())
    return new Response('send failed', { status: 502 })
  }
  return new Response('sent', { status: 200 })
})
