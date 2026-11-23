import { Recipe } from '../types/pantry';

function isRecipe(value: unknown): value is Omit<Recipe, 'id'> {
  if (!value || typeof value !== 'object') return false;
  const recipe = value as Record<string, unknown>;
  const validLines = (lines: unknown) =>
    Array.isArray(lines) && lines.length > 0 && lines.length <= 40 &&
    lines.every((line) => typeof line === 'string' && line.trim().length > 0 && line.length <= 1000);
  return typeof recipe.title === 'string' && !!recipe.title.trim() && recipe.title.length <= 200 &&
    typeof recipe.prepTime === 'string' && recipe.prepTime.length <= 100 &&
    typeof recipe.servings === 'number' && Number.isSafeInteger(recipe.servings) &&
    recipe.servings > 0 && recipe.servings <= 1000 &&
    (recipe.category === 'meal' || recipe.category === 'baking') &&
    validLines(recipe.ingredients) && validLines(recipe.steps);
}

export async function requestAiRecipe(serverUrl: string, accessToken: string, request: string): Promise<Omit<Recipe, 'id'>> {
  const base = serverUrl.trim().replace(/\/+$/, '');
  if (!/^(https:\/\/[a-z0-9.-]+(?::\d+)?|http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?)(?:\/[a-z0-9._~/-]*)?$/i.test(base)) {
    throw new Error('Enter an HTTPS server URL (HTTP is only allowed for localhost).');
  }
  if (!accessToken.trim()) throw new Error('Enter the server access token.');
  if (!request.trim() || request.length > 500) throw new Error('Enter a recipe request of up to 500 characters.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 65000);
  try {
    const response = await fetch(`${base}/recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken.trim()}` },
      body: JSON.stringify({ request: request.trim() }),
      signal: controller.signal,
    });
    const result: unknown = await response.json();
    if (!response.ok) {
      const error = result && typeof result === 'object' && 'error' in result ? result.error : null;
      throw new Error(typeof error === 'string' && error.trim() ? error : 'The recipe server could not process your request.');
    }
    if (!isRecipe(result)) throw new Error('The recipe server returned an invalid recipe.');
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
