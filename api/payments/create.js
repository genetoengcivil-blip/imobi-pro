import { z } from "zod";
import { payment } from "../_lib/mp.js";
import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { json, readBody } from "../_lib/utils.js";

const schema = z.object({
  token: z.string().min(10),
  payment_method_id: z.string().min(2),
  issuer_id: z.string().optional(),
  installments: z.number().int().min(1).max(12).default(1),

  plano: z.string().min(1),
  amount: z.number().positive(),

  payer: z.object({
    email: z.string().email(),
    nome: z.string().optional().default("")
  }),

  signup: z.any().optional()
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await readBody(req);
    const input = schema.parse(body);

    const payload = {
      token: input.token,
      transaction_amount: input.amount,
      installments: input.installments,
      payment_method_id: input.payment_method_id,
      issuer_id: input.issuer_id,
      description: `ImobiPro • Plano ${input.plano}`,
      payer: {
        email: input.payer.email
      }
    };

    const mpResp = await payment.create({ body: payload });
    const p = mpResp?.id ? mpResp : mpResp?.body;

    if (!p?.id) {
      return json(res, 400, {
        ok: false,
        error: "Falha ao criar pagamento no Mercado Pago",
        details: mpResp
      });
    }

    await supabaseAdmin.from("pagamentos").insert({
      mp_payment_id: String(p.id),
      user_email: input.payer.email,
      plano: input.plano,
      status: p.status || "pending",
      valor: input.amount,
      raw: p,
      signup_raw: input.signup || null
    });

    return json(res, 200, {
      ok: true,
      mp_payment_id: String(p.id),
      status: p.status,
      status_detail: p.status_detail
    });

  } catch (err) {
    console.error("CREATE PAYMENT ERROR:", err);
    return json(res, 400, { ok: false, error: err.message });
  }
}
