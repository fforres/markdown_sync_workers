import { Bindings } from "./sharedTypes";

export class MarkdownDurableObject {
  state: DurableObjectState;
  env: Bindings;
  sessions: { ws: WebSocket; quit: boolean }[];
  constructor(state: DurableObjectState, env: Bindings) {
    this.state = state;
    this.env = env;
    this.sessions = [];
  }

  async fetch(request: Request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Expected upgrade: websocket", { status: 426 });
    }
    const wsPair = new WebSocketPair();
    const [client, server] = Object.values(wsPair);
    let ip = request.headers.get("CF-Connecting-IP");
    this.handleSession(server, ip);
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  handleSession(webSocket: WebSocket, ip: string | null) {
    webSocket.accept();
    let session = { ws: webSocket, quit: false };
    this.sessions.push(session);
    let handshake = false;
    webSocket.addEventListener("message", (msg) => {
      try {
        if (session.quit) {
          webSocket.close(1011, "WebSocket broken.");
        }
        console.log("handshake", handshake);
        if (!handshake) {
          webSocket.send(JSON.stringify({ ready: true }));
          handshake = true;
          return;
        }
        console.log("msg.data", msg.data);
        let data = JSON.parse(msg.data.toString());
        this.env.MARKDOWN_KV.put(`_FILE_${data.fileId}`, data.content);

        console.log(`_FILE_${data.fileId}`, data.content);
      } catch (err) {
        console.error(err);
        webSocket.send(JSON.stringify({ error: (err as Error).stack }));
      }
    });

    const closeOrErrorHandler = (evt: CloseEvent | ErrorEvent) => {
      console.log("Disconnecting socket");
      session.quit = true;
      this.sessions = this.sessions.filter((member) => member !== session);
    };

    webSocket.addEventListener("close", closeOrErrorHandler);
    webSocket.addEventListener("error", closeOrErrorHandler);
  }
}
