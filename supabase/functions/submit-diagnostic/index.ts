const env = (name: string, fallback = "") => Deno.env.get(name) || fallback;

const defaultOrigin = "https://falko1505.github.io";

function corsHeaders(req: Request) {
  const allowedOrigin = env("ALLOWED_ORIGIN", defaultOrigin);
  const requestOrigin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function html(v: unknown) {
  return safe(v).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char] || char);
}

function field(target: Record<string, unknown>, envName: string, defaultKey: string, value: unknown) {
  const key = env(envName, defaultKey);
  if (key && value !== undefined && value !== null && safe(value) !== "") target[key] = value;
}

async function persistDiagnostic(body: any) {
  const url = env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return { skipped: true };

  const payload = {
    diagnostic_id: body.diagnostic_id,
    created_at: body.created_at,
    source: body.source || "online",
    lead: body.lead,
    total_score: body.total_score,
    maturity_pct: body.maturity_pct,
    profile: body.profile,
    dimensions: body.dimensions,
    answers: body.answers,
    result_url: body.result_url
  };

  const r = await fetch(`${url}/rest/v1/diagnostics?on_conflict=diagnostic_id`, {
    method: "POST",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(payload)
  });

  if (!r.ok) throw new Error(`Database: ${r.status} ${await r.text()}`);
  return { ok: true };
}

async function sendToRD(body: any) {
  const apiKey = env("RD_API_KEY");
  if (!apiKey) return { skipped: true, reason: "RD_API_KEY not configured" };

  const lead = body.lead || {};
  const payload: Record<string, unknown> = {
    conversion_identifier: env("RD_CONVERSION_IDENTIFIER", "quiz-diagnostico-manutencao-rog2026"),
    name: lead.name,
    email: lead.email,
    personal_phone: lead.phone || undefined,
    company_name: lead.company || undefined,
    job_title: lead.role || undefined,
    traffic_source: env("RD_TRAFFIC_SOURCE", "ROG.e 2026 / Diagnóstico Online"),
    tags: ["ROG.e 2026", "Diagnóstico de Manutenção"],
    legal_bases: [{ category: "communications", type: "consent", status: "granted" }]
  };

  field(payload, "RD_CF_EMAIL_CORPORATIVO", "cf_e_mail_corporativo", lead.email);
  field(payload, "RD_CF_SEGMENTO", "cf_segmento", lead.segment);
  field(payload, "RD_CF_ORIGEM", "cf_origem", env("RD_TRAFFIC_SOURCE", "ROG.e 2026 / Diagnóstico Online"));
  field(payload, "RD_CF_SCORE", "cf_diagnostico_rog_e_2026_score_total", Number(body.total_score));
  field(payload, "RD_CF_MATURIDADE", "cf_diagnostico_rog_e_2026_maturidade", Number(body.maturity_pct));
  field(payload, "RD_CF_PERFIL", "cf_diagnostico_rog_e_2026_perfil", body.profile?.name);
  field(payload, "RD_CF_DIAGNOSTIC_ID", "cf_diagnostico_rog_e_2026_id", body.diagnostic_id);
  field(payload, "RD_CF_CONSENTIMENTO", "cf_diagnostico_rog_e_2026_consentimento_lgpd", lead.consent ? "Sim — consentimento explícito no formulário" : "Não");
  field(payload, "RD_CF_RESULT_URL", "cf_diagnostico_rog_e_2026_url_individual_do_resultado", body.result_url);

  const dims = Array.isArray(body.dimensions) ? body.dimensions : [];
  field(payload, "RD_CF_DIM_1", "cf_diagnostico_rog_e_2026_estrategia_e_cultura", dims[0]?.pct);
  field(payload, "RD_CF_DIM_2", "cf_diagnostico_rog_e_2026_planejamento_e_controle_da_manu", dims[1]?.pct);
  field(payload, "RD_CF_DIM_3", "cf_diagnostico_rog_e_2026_dados_e_confiabilidade", dims[2]?.pct);
  field(payload, "RD_CF_DIM_4", "cf_diagnostico_rog_e_2026_tecnologia_e_preditiva", dims[3]?.pct);

  const answers = Array.isArray(body.answers) ? body.answers : [];
  answers.slice(0, 8).forEach((a: any, i: number) => {
    field(payload, `RD_CF_Q${i + 1}`, `cf_diagnostico_rog_e_2026_resposta_q${i + 1}`, a.answer);
  });

  const r = await fetch(`https://api.rd.services/platform/conversions?api_key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "CONVERSION",
      event_family: "CDP",
      payload
    })
  });

  if (!r.ok) throw new Error(`RD Station: ${r.status} ${await r.text()}`);
  return { ok: true };
}

function emailHtml(body: any) {
  const lead = body.lead || {};
  const first = html(safe(lead.name).split(" ")[0] || "Olá");
  const resultUrl = html(body.result_url);
  const profile = html(body.profile?.name);
  const pct = Number(body.maturity_pct || 0);

  return `
  <div style="margin:0;padding:32px 16px;background:#f4f6fa;font-family:Arial,sans-serif;color:#182235">
    <div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;overflow:hidden">
      <div style="padding:24px 28px;background:#003082;color:#fff">
        <div style="font-size:22px;font-weight:700">Infotec Brasil</div>
        <div style="font-size:12px;opacity:.8;margin-top:4px">Diagnóstico de Maturidade em Manutenção</div>
      </div>
      <div style="padding:30px 28px">
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px">${first}, seu diagnóstico está pronto.</p>
        <div style="padding:20px;background:#f2f7fc;border-left:4px solid #f27d00;border-radius:0 12px 12px 0;margin:18px 0">
          <div style="font-size:34px;font-weight:800;color:#003082">${pct}%</div>
          <div style="font-size:14px;font-weight:700;color:#003082;margin-top:4px">${profile}</div>
        </div>
        <p style="font-size:14px;line-height:1.65;color:#5c6b84">Acesse o resultado completo para visualizar as quatro dimensões, os próximos passos recomendados e salvar uma cópia em PDF.</p>
        <p style="margin:24px 0">
          <a href="${resultUrl}" style="display:inline-block;background:#f27d00;color:#fff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px">Acessar meu diagnóstico</a>
        </p>
        <p style="font-size:12px;line-height:1.55;color:#7a879b">Se o botão não abrir, copie este endereço no navegador:<br>${resultUrl}</p>
      </div>
    </div>
  </div>`;
}

async function sendEmail(body: any) {
  const apiKey = env("RESEND_API_KEY");
  const from = env("EMAIL_FROM");
  const to = safe(body.lead?.email);
  if (!apiKey || !from || !to) return { skipped: true, reason: "Email not configured" };

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Seu Diagnóstico de Manutenção | Infotec Brasil",
      html: emailHtml(body)
    })
  });

  if (!r.ok) throw new Error(`Email: ${r.status} ${await r.text()}`);
  return { ok: true };
}

Deno.serve(async (req) => {
  const responseHeaders = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: responseHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...responseHeaders, "Content-Type": "application/json" }
      });
    }

    const body = await req.json();
    if (
      !body?.diagnostic_id || !body?.lead?.email || body?.lead?.consent !== true ||
      !Number.isInteger(body?.total_score) || body.total_score < 0 || body.total_score > 24 ||
      !Number.isInteger(body?.maturity_pct) || body.maturity_pct < 0 || body.maturity_pct > 100 ||
      !Array.isArray(body?.dimensions) || body.dimensions.length !== 4 ||
      !Array.isArray(body?.answers) || body.answers.length !== 8
    ) {
      return new Response(JSON.stringify({ error: "Invalid diagnostic payload" }), {
        status: 400, headers: { ...responseHeaders, "Content-Type": "application/json" }
      });
    }

    const result: Record<string, unknown> = {};
    result.database = await persistDiagnostic(body);

    result.rd = await sendToRD(body);

    try { result.email = await sendEmail(body); }
    catch (e) { result.email = { ok: false, error: String(e) }; }

    return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200, headers: { ...responseHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...responseHeaders, "Content-Type": "application/json" }
    });
  }
});
