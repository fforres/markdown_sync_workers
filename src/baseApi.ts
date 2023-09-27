import { Hono } from "hono";
import { cors } from "hono/cors";
import { bearerAuth } from "hono/bearer-auth";
import { Bindings } from "./sharedTypes";

export const app = new Hono<{
  Bindings: Bindings;
}>().basePath("/api");

const token = "72487c76-b43a-4a98-8b05-dcb5d914bfb3";

app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS", "POST"],
    maxAge: 86400,
    credentials: true,
  }),
);

app.use("/api/*", bearerAuth({ token }));
