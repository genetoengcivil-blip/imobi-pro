import { Resend } from "resend";
import { ENV } from "./env.js";

const resend = new Resend(ENV.RESEND_API_KEY);

export async function sendWelcomeEmail({ to, nome, loginUrl, email, senha }) {
  const subject = "Seu acesso ao ImobiPro está pronto ✅";

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
    <h2>Olá, ${escapeHtml(nome || "bem-vindo(a)")}!</h2>
    <p>Seu acesso ao <strong>ImobiPro</strong> foi criado com sucesso.</p>

    <div style="background:#f1f5f9;padding:14px;border-radius:12px">
      <p style="margin:0"><strong>Login:</strong> ${escapeHtml(email)}</p>
      <p style="margin:0"><strong>Senha:</strong> ${escapeHtml(senha)}</p>
    </div>

    <p style="margin-top:16px">
      Acesse aqui: <a href="${loginUrl}">${loginUrl}</a>
    </p>

    <p style="font-size:12px;color:#64748b">
      Recomendamos alterar sua senha no primeiro acesso.
    </p>
  </div>`;

  const { error } = await resend.emails.send({
    from: ENV.RESEND_FROM,
    to: [to],
    subject,
    html
  });

  if (error) throw new Error(`Falha ao enviar e-mail: ${error.message}`);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
