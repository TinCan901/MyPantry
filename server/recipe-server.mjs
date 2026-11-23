import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const schema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    title: { type: 'string' },
    prepTime: { type: 'string' },
    servings: { type: 'integer' },
    category: { type: 'string', enum: ['meal', 'baking'] },
    ingredients: { type: 'array', items: { type: 'string' } },
    steps: { type: 'array', items: { type: 'string' } },
  },
  required: ['error', 'title', 'prepTime', 'servings', 'category', 'ingredients', 'steps'],
  additionalProperties: false,
};

function validRecipe(value) {
  const validLines = (lines) => Array.isArray(lines) && lines.length > 0 &&
    lines.length <= 40 && lines.every((line) => typeof line === 'string' && line.trim().length > 0 && line.length <= 1000);
  return value && typeof value.title === 'string' && value.title.trim().length > 0 &&
    value.title.length <= 200 && typeof value.prepTime === 'string' && value.prepTime.length <= 100 &&
    Number.isSafeInteger(value.servings) && value.servings > 0 && value.servings <= 1000 &&
    (value.category === 'meal' || value.category === 'baking') &&
    validLines(value.ingredients) && validLines(value.steps);
}

function respond(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

export function createRecipeServer({ apiKey, model = 'gpt-5.4-mini', fetchImpl = fetch }) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required.');
  }
  let requests = [];
  let activeRequests = 0;
  return createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS' && req.url === '/recipe') {
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      });
      res.end();
      return;
    }
    if (req.method !== 'POST' || req.url !== '/recipe') {
      respond(res, 404, { error: 'Not found.' });
      return;
    }
    let body = '';
    try {
      for await (const chunk of req) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 4096) {
          respond(res, 413, { error: 'Request is too large.' });
          return;
        }
      }
      let input;
      try {
        input = JSON.parse(body);
      } catch {
        respond(res, 400, { error: 'Invalid request JSON.' });
        return;
      }
      if (typeof input?.request !== 'string' || !input.request.trim() || input.request.length > 500) {
        respond(res, 400, { error: 'Enter a recipe request of up to 500 characters.' });
        return;
      }
      const now = Date.now();
      requests = requests.filter((time) => now - time < 60000);
      if (requests.length >= 10 || activeRequests >= 2) {
        respond(res, 429, { error: 'Too many requests. Please try again shortly.' });
        return;
      }
      requests.push(now);
      activeRequests++;
      try {
        const upstream = await fetchImpl('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(60000),
          body: JSON.stringify({
            model,
            store: false,
            max_output_tokens: 2000,
            instructions: 'Create one practical recipe for the requested dish with quantities, clear steps, safe cooking instructions, and servings. Use category baking for baked goods, otherwise meal. Do not invent nutrition information. If the request is not a recipe request or cannot be fulfilled, explain briefly in error and use empty fields.',
            input: input.request.trim(),
            text: { format: { type: 'json_schema', name: 'recipe', strict: true, schema } },
          }),
        });
        if (!upstream.ok) {
          console.error(`Recipe provider returned HTTP ${upstream.status}`);
          respond(res, 502, { error: 'The recipe service failed. Check the server configuration and try again.' });
          return;
        }
        const data = await upstream.json();
        if (data.status !== 'completed') {
          respond(res, 502, { error: 'The recipe service did not finish its response. Please try again.' });
          return;
        }
        const content = data.output?.flatMap((item) => item.type === 'message' ? item.content : []) ?? [];
        if (content.some((item) => item.type === 'refusal')) {
          respond(res, 422, { error: 'The recipe service could not fulfill that request.' });
          return;
        }
        const text = content.find((item) => item.type === 'output_text')?.text;
        const recipe = JSON.parse(text);
        if (typeof recipe.error === 'string' && recipe.error.trim()) {
          respond(res, 422, { error: recipe.error.slice(0, 500) });
        } else if (!validRecipe(recipe)) {
          respond(res, 502, { error: 'The recipe service returned an invalid recipe. Please try again.' });
        } else {
          const { title, prepTime, servings, category, ingredients, steps } = recipe;
          respond(res, 200, { title, prepTime, servings, category, ingredients, steps });
        }
      } finally {
        activeRequests--;
      }
    } catch (error) {
      console.error('Recipe request failed:', error instanceof Error ? error.message : 'Unknown error');
      if (!res.headersSent) respond(res, 502, { error: 'Could not generate the recipe. Please try again.' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const server = createRecipeServer({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || undefined,
    });
    server.listen(Number(process.env.PORT || 3001), '0.0.0.0', () => console.log('Recipe server is listening.'));
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Could not start recipe server.');
    process.exitCode = 1;
  }
}
