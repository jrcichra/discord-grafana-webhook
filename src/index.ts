export interface Env {
  USERNAME: string;
  PASSWORD: string;
  WEBHOOK_URL: string;
}

const BASIC = "Basic ";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    let auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith(BASIC)) {
      return new Response(
        JSON.stringify({ error: "Basic Authorization header required" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }
    auth = atob(auth.replace(BASIC, ""));
    // extract the username and password
    const username = auth.split(":")[0];
    const password = auth.split(":")[1];
    // Block if they're not allowed
    if (username !== env.USERNAME || password !== env.PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
    // post to Discord at the provided webhook url
    const requestJSON: any = await request.json();
    const discordResponse = await fetch(env.WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: requestJSON.ruleName,
            description: requestJSON.message,
            fields: [
              {
                name: "url",
                value: requestJSON.ruleUrl,
                inline: "true",
              },
            ],
          },
        ],
      }),
    });
    if (discordResponse.status !== 200) {
      return discordResponse;
    }

    return new Response(JSON.stringify({ message: "success" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  },
};
