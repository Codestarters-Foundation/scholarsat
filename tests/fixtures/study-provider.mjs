// Preloaded only in the isolated localhost integration test process.
import { generateKeyPairSync, sign, createHash } from "node:crypto";
import assert from "node:assert/strict";
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const original = globalThis.fetch;
const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  if (url.hostname === "auth.openai.com") {
    if (url.pathname.endsWith("jwks.json"))
      return Response.json({
        keys: [
          {
            ...publicKey.export({ format: "jwk" }),
            kid: "fixture",
            alg: "RS256",
            use: "sig",
          },
        ],
      });
    assert.equal(url.pathname, "/api/accounts/oauth/token");
    const fields = new URLSearchParams(await request.text());
    const [nonce, challenge] = fields.get("code").split(".");
    assert.equal(
      createHash("sha256")
        .update(fields.get("code_verifier"))
        .digest("base64url"),
      challenge,
    );
    const claims = {
      iss: url.origin,
      sub: "fixture",
      aud: fields.get("client_id"),
      nonce,
      exp: Math.floor(Date.now() / 1000) + 600,
    };
    const body =
      encode({ alg: "RS256", kid: "fixture" }) + "." + encode(claims);
    return Response.json({
      id_token:
        body +
        "." +
        sign("RSA-SHA256", Buffer.from(body), privateKey).toString("base64url"),
      access_token: "test-plan",
      scope: "resource.invoke chatgpt.tokens.use.direct",
      expires_in: 600,
    });
  }
  if (url.hostname === "api.openai.com") {
    const token = request.headers.get("authorization");
    if (url.pathname.endsWith("/models")) {
      assert.equal(token, "Bearer test-plan");
      return Response.json({
        models: [{ visibility: "list", slug: "fixture-sol" }],
      });
    }
    assert.equal(url.pathname, "/v1/responses");
    if (!["Bearer test-plan", "Bearer test-key"].includes(token))
      return new Response(null, { status: 401 });
    const body = await request.json();
    assert.equal(body.store, false);
    assert.equal(body.stream, true);
    assert.equal(
      body.model,
      token === "Bearer test-plan" ? "fixture-sol" : "gpt-4.1-mini",
    );
    if (body.input[0].content.includes("teach by drawing")) {
      assert.match(body.input[0].content,/Correct answer:/);
      const text = JSON.stringify({steps:[{say:"Check the constant term first.",marks:[],board:["x = 8"]}]});
      return new Response("data: "+JSON.stringify({type:"response.completed",response:{output:[{content:[{type:"output_text",text}]}]}})+"\n\n");
    }
    assert.match(body.input[0].content, /provisional/);
    return new Response(
      'data: {"type":"response.completed","response":{"output":[{"content":[{"type":"output_text","text":"Fixture explanation."}]}]}}\n\n',
    );
  }
  return original(input, init);
};
