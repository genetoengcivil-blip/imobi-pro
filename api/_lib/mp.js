import mercadopago from "mercadopago";
import { ENV } from "./env.js";

mercadopago.configure({ access_token: ENV.MP_ACCESS_TOKEN });

export const mp = mercadopago;
