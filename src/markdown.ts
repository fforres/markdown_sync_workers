import { app } from "./baseApi";
import { env } from "hono/adapter";

app.all("/md/file/ws/*", async (c) => {
  const fileId = c.req.url.split("/md/file/ws/")[1];
  if (!fileId) {
    return c.json({ error: "file_id is required for path md/file/:file_id" });
  }

  const { MARKDOWN_DO } = env(c);
  const id = MARKDOWN_DO.idFromName(fileId);
  const file = MARKDOWN_DO.get(id);
  const client = await file.fetch(c.req.raw);
  return new Response(null, {
    status: 101,
    webSocket: client.webSocket,
  });
});

app.get("/md/file/*", async (c) => {
  const fileId = c.req.url.split("/md/file/")[1];
  if (!fileId) {
    return c.json({ error: "file_id is required for path md/file/:file_id" });
  }
  const { MARKDOWN_KV } = env(c);
  const content = await MARKDOWN_KV.get(`_FILE_${fileId}`);
  return c.json({ content, fileId });
});

app.get("/md/files", async (c) => {
  const { MARKDOWN_KV } = env(c);
  const content = await MARKDOWN_KV.get(`_FILES_`);

  return c.json({ content });
});
