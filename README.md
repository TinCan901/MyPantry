RUN IN TERMINAL:

npx expo start --tunnel ngrok


$env:Path = "C:\Program Files\nodejs;$env:Path"
npx expo lint



# Welcome to your Expo app 👋

## Built-in recipe generator

PantryPrep creates recipe suggestions on-device using your pantry and meal preferences. It works offline and does not require an AI account, API key, or external provider.

In Saved, choose **Add a cookbook recipe** to type a recipe, including baking recipes. Enter one ingredient and instruction per line; nutrition is not estimated for these recipes. In Meals, choose **Baking** for offline baking ideas. These are regular recipes, not necessarily low-carb; use the ingredient list to see what is in your pantry or add missing items to shopping. Photo scanning is not currently supported.

## Ask AI for a recipe

The **Meals → Ask AI** option sends only your typed request to an OpenAI-powered recipe server. It requires internet, an OpenAI account with API access and billing, and a separately deployed server. Recipes are not guaranteed to be accurate or low-carb; check ingredients, allergens, and cooking temperatures. Save a generated recipe using its **Save** button.

The server uses Node.js 20 or newer. Deploy `server/recipe-server.mjs` to a Node host behind HTTPS and configure these environment variables in the host's secret settings:

- `OPENAI_API_KEY`: your OpenAI API key. Never put it in the app or share it in chat.
- `RECIPE_ACCESS_TOKEN`: a random secret of at least 32 characters. Generate one locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Enter this token in the app, not the OpenAI key.
- `RECIPE_ALLOWED_ORIGINS`: comma-separated exact origins of your web app, such as `https://example.com`. Required for web browsers; native apps do not send a browser origin.
- `PORT`: supplied by the host, or defaults to 3001. `OPENAI_MODEL` is optional and defaults to `gpt-5.4-mini`.

Run the server with `node server/recipe-server.mjs`. In **Ask AI**, enter the HTTPS base URL and access token, then describe the dish. The token is kept in memory only, so it must be entered again after restarting the app. For local browser testing, HTTP is allowed only for `localhost` or `127.0.0.1`; include the browser's exact origin in `RECIPE_ALLOWED_ORIGINS`. Phone apps generally need a deployed HTTPS URL.

The server requires the access token, limits request sizes and applies a basic per-process request limit. For an internet-facing deployment, use a hosting provider's HTTPS, additional rate limiting and spending limits; protect and rotate the access token if exposed. OpenAI usage can incur charges. Run backend checks with `node --test server/recipe-server.test.mjs`.

## Host the web app on Render

Push your changes to GitHub, then create a **Static Site** in Render and connect this repository. Use `npm ci && npx expo export --platform web` as the build command and `dist` as the publish directory. Render will build the selected branch on each push. The web app stores pantry and recipe data in the browser on that device; it does not sync between devices.

For direct links and page refreshes, add **Rewrite** rules in the site's Redirects/Rewrites settings: `/meals` to `/meals.html`, `/saved` to `/saved.html`, and `/shopping` to `/shopping.html`.

The static site does not run the AI backend. Deploy the recipe server separately as described above before using **Ask AI**.

## Build the iOS and Android apps

This project includes Expo build profiles for iOS and Android. Install the Expo Build CLI with `npx eas-cli@latest build:configure`, sign in to an Expo account, and run `npx eas-cli@latest build --platform ios` or `npx eas-cli@latest build --platform android --profile preview`. iOS builds require Apple developer account credentials and a valid signing certificate. The `preview` Android profile produces an installable `.apk`.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
