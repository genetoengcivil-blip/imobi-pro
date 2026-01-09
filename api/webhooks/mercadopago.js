import crypto from "crypto";
import { readBody, json, randomPassword, makeSlug } from "../_lib/utils.js";
import { ENV } from "../_lib/env.js";
import { mp } from "../_lib/mp.js";
import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { sendWelcomeEmail } from "../_lib/email.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const body = await readBody(req);

    // Webhook típico: { type: "payment", data: { id: "123" } }
    const paymentId = body?.data?.id ? String(body.data.id) : null;
    if (!paymentId) return json(res, 200, { ok: true, ignored: true });

    // (Opcional) Validação de assinatura - best effort
    // Se falhar, NÃO provisiona automaticamente sem confirmar o pagamento via API.
    const signatureOk = verifyMercadoPagoSignature(req, paymentId);
    // não bloqueia, apenas registra (a fonte da verdade será a API MP)
    // console.log("signatureOk:", signatureOk);

    // 1) consulta pagamento na API do MP (fonte da verdade)
    const mpResp = await mp.payment.findById(paymentId);
    const p = mpResp?.body;

    if (!p?.id) return json(res, 200, { ok: true, not_found: true });

    const status = p.status; // approved | pending | rejected...
    const payerEmail = p.payer?.email;

    // 2) atualiza tabela pagamentos
    await supabaseAdmin
      .from("pagamentos")
      .update({ status, raw: p })
      .eq("mp_payment_id", paymentId);

    // 3) só provisiona se APPROVED
    if (status !== "approved") {
      return json(res, 200, { ok: true, status });
    }

    // 4) idempotência: se já provisionou, não repete
    const { data: existing } = await supabaseAdmin
      .from("corretores")
      .select("id,email,user_id,slug")
      .eq("email", payerEmail)
      .maybeSingle();

    if (existing?.id) {
      return json(res, 200, { ok: true, alreadyProvisioned: true, corretor_id: existing.id });
    }

    // 5) puxa signup_raw salvo no create (se existir)
    const { data: payRow } = await supabaseAdmin
      .from("pagamentos")
      .select("signup_raw, plano, valor")
      .eq("mp_payment_id", paymentId)
      .maybeSingle();

    const signup = payRow?.signup_raw || {};
    const nome = signup?.nome || p?.additional_info?.payer?.first_name || "";
    const plano = payRow?.plano || "pro";

    // 6) cria usuário no Supabase Auth
    const senha = randomPassword();
    const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: payerEmail,
      password: senha,
      email_confirm: true
    });

    if (authErr) throw new Error(`Erro ao criar Auth user: ${authErr.message}`);
    const userId = created.user.id;

    // 7) cria corretor (perfil)
    const slug = makeSlug(nome, payerEmail);
    const siteUrl = `https://${slug}.imobi-pro.com`;

    const { data: corretorRow, error: corrErr } = await supabaseAdmin
      .from("corretores")
      .insert({
        user_id: userId,
        nome: nome || signup?.nome || "Corretor",
        email: payerEmail,
        telefone: signup?.telefone || null,
        plano,
        status: "ativo",
        slug,
        site_url: siteUrl,
        signup_raw: signup
      })
      .select("*")
      .single();

    if (corrErr) throw new Error(`Erro ao inserir corretor: ${corrErr.message}`);

    // 8) cria CRM básico (workspace individual)
    await supabaseAdmin.from("crm_workspaces").insert({
      corretor_id: corretorRow.id,
      nome: `CRM • ${corretorRow.nome}`,
      plano
    });

    // 9) cria site (registro)
    await supabaseAdmin.from("sites").insert({
      corretor_id: corretorRow.id,
      dominio: `${slug}.imobi-pro.com`,
      ativo: true
    });

    // 10) envia e-mail boas-vindas
    await sendWelcomeEmail({
      to: payerEmail,
      nome: corretorRow.nome,
      loginUrl: ENV.APP_LOGIN_URL,
      email: payerEmail,
      senha
    });

    // 11) marca provisionado
    await supabaseAdmin
      .from("pagamentos")
      .update({ provisionado: true, corretor_id: corretorRow.id })
      .eq("mp_payment_id", paymentId);

    return json(res, 200, { ok: true, status, corretor_id: corretorRow.id, site_url: siteUrl, signatureOk });

  } catch (e) {
    // webhooks devem responder 200 sempre que possível para evitar re-tentativas infinitas
    return json(res, 200, { ok: false, error: e.message });
  }
}

function verifyMercadoPagoSignature(req, paymentId) {
  try {
    const secret = ENV.MP_WEBHOOK_SECRET;
    if (!secret) return false;

    const xSignature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"];

    if (!xSignature || !xRequestId) return false;

    // Formato: "ts=1704908010,v1=abcdef..."
    const parts = String(xSignature).split(",");
    const ts = parts.find(p => p.trim().startsWith("ts="))?.split("=")[1];
    const v1 = parts.find(p => p.trim().startsWith("v1="))?.split("=")[1];

    if (!ts || !v1) return false;

    // "data.id:{id};request-id:{x-request-id};ts:{ts};"
    const manifest = `data.id:${paymentId};request-id:${xRequestId};ts:${ts};`;

    const calculated = crypto
      .createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");

    return timingSafeEqual(calculated, v1);
  } catch {
    return false;
  }
}

function timingSafeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}
