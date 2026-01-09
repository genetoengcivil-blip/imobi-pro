import { MercadoPagoConfig, Payment } from "mercadopago";

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error("MP_ACCESS_TOKEN not set");
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const payment = new Payment(client);

export { payment };
