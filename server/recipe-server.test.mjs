import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { createRecipeServer } from './recipe-server.mjs';

const accessToken = 'test-token-abcdefghijklmnopqrstuvwxyz';
const recipe = {
  error: '',
  title: 'Lemon cake',
  prepTime: '45 mins',
  servings: 8,
  category: 'baking',
  ingredients: ['200g flour', '2 lemons'],
  steps: ['Mix the ingredients.', 'Bake until a skewer comes out clean.'],
};

async function withServer(fetchImpl, run) {
  const server = createRecipeServer({
    apiKey: 'test-key',
    accessToken,
    allowedOrigins: ['http://localhost:19091'],
    fetchImpl,
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function providerResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status });
}

function post(base, body, token = accessToken, headers = {}) {
  return fetch(`${base}/recipe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

test('requires authentication and validates requests before calling the provider', async () => {
  let calls = 0;
  await withServer(async () => { calls++; }, async (base) => {
    assert.equal((await post(base, { request: 'cake' }, 'wrong')).status, 401);
    assert.equal((await post(base, { request: '   ' })).status, 400);
    assert.equal((await post(base, '{')).status, 400);
    assert.equal((await post(base, { request: 'x'.repeat(501) })).status, 400);
    assert.equal((await post(base, 'x'.repeat(5000))).status, 413);
    assert.equal(calls, 0);
  });
});

test('sends the requested dish to OpenAI and returns a validated recipe', async () => {
  await withServer(async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    const body = JSON.parse(options.body);
    assert.equal(body.input, 'lemon cake');
    assert.equal(body.store, false);
    assert.equal(body.text.format.type, 'json_schema');
    return providerResponse({
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(recipe) }] }],
    });
  }, async (base) => {
    const response = await post(base, { request: ' lemon cake ' }, accessToken, { Origin: 'http://localhost:19091' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:19091');
    const { error, ...expected } = recipe;
    assert.deepEqual(await response.json(), expected);
  });
});

test('rejects disallowed browser origins and handles provider failures and invalid output', async () => {
  let result = providerResponse({}, 503);
  await withServer(async () => result, async (base) => {
    assert.equal((await post(base, { request: 'cake' }, accessToken, { Origin: 'https://unknown.example' })).status, 403);
    assert.equal((await post(base, { request: 'cake' })).status, 502);
    result = providerResponse({ status: 'incomplete', output: [] });
    assert.equal((await post(base, { request: 'cake' })).status, 502);
    result = providerResponse({
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ ...recipe, ingredients: [] }) }] }],
    });
    assert.equal((await post(base, { request: 'cake' })).status, 502);
    result = providerResponse({
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No' }] }],
    });
    assert.equal((await post(base, { request: 'cake' })).status, 422);
  });
});

test('app client generates a recipe through the server and surfaces errors', async () => {
  const source = readFileSync(new URL('../src/utils/aiRecipe.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  runInNewContext(code, { exports, fetch, AbortController, setTimeout, clearTimeout });
  await withServer(async () => providerResponse({
    status: 'completed',
    output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(recipe) }] }],
  }), async (base) => {
    const result = await exports.requestAiRecipe(base, accessToken, 'lemon cake');
    assert.equal(result.title, 'Lemon cake');
    assert.equal(result.category, 'baking');
    assert.equal(result.ingredients.length, 2);
    await assert.rejects(exports.requestAiRecipe(base, 'wrong', 'lemon cake'), /Invalid access token/);
    await assert.rejects(exports.requestAiRecipe('http://example.com', accessToken, 'cake'), /HTTPS/);
    await assert.rejects(exports.requestAiRecipe(base, accessToken, ''), /recipe request/);
  });
});
