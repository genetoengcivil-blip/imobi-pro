import { payment } from "../_lib/mp.js";
import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { json } from "../_lib/utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const event = req.body;

    if (event.type !== "payment") {
      return json(res, 200, { ignored: true });
    }

    const paymentId = event.data?.id;
    if (!paymentId) {
      return json(res, 400, { error: "Missing payment id" });
    }

    const mpResp = await payment.get({ id: paymentId });
    const p = mpResp?.id ? mpResp : mpResp?.body;

    if (!p?.id) {
      return json(res, 400, { error: "Payment not found on MP" });
    }

    const status = p.status;

    const { data: localPayment } = await supabaseAdmin
      .from("pagamentos")
      .select("*")
      .eq("mp_payment_id", String(p.id))
      .single();

    if (!localPayment) {
      return json(res, 200, { warning: "Payment not registered locally" });
    }

    if (localPayment.status === "approved") {
      return json(res, 200, { already_processed: true });
    }

    await supabaseAdmin
      .from("pagamentos")
      .update({
        status,
        status_detail: p.status_detail,
        raw: p,
        updated_at: new Date().toISOString()
      })
      .eq("id", localPayment.id);

    return json(res, 200, { ok: true, status });

  } catch (err) {
    console.error("MP WEBHOOK ERROR:", err);
    return json(res, 500, { error: "Webhook processing failed" });
  }
}
