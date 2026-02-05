# My Static Site

[![Node CI](https://github.com/AmitKrVarman/quiz-app/actions/workflows/node-tests.yml/badge.svg)](https://github.com/AmitKrVarman/quiz-app/actions/workflows/node-tests.yml) [![Coverage](https://codecov.io/gh/AmitKrVarman/quiz-app/branch/main/graph/badge.svg?token=CODECOV_TOKEN)](https://codecov.io/gh/AmitKrVarman/quiz-app)

This project is a simple static website that serves as an entry point for users. It includes essential files for a functional web presence, including HTML, CSS, JavaScript, and documentation.

> Note: The project includes a GitHub Actions workflow that runs unit tests and publishes coverage to Codecov. For private repositories, add a `CODECOV_TOKEN` repository secret (see Codecov docs) to enable automatic coverage uploads and the coverage badge.

## Project Structure

```
my-static-site
├── public
│   ├── index.html        # Main HTML document
│   ├── 404.html         # Custom 404 error page
│   ├── robots.txt       # Instructions for web crawlers
│   ├── css
│   │   └── styles.css    # CSS styles for the website
│   └── js
│       └── main.js       # JavaScript for client-side functionality
├── docs
│   └── about.md          # Documentation about the website
├── .gitignore            # Files to ignore in version control
└── README.md             # Project documentation
```

## Features

- **Responsive Design**: The website is designed to be responsive and user-friendly.
- **Custom 404 Page**: A dedicated page for handling non-existent routes.
- **SEO Friendly**: The `robots.txt` file helps manage search engine indexing.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd my-static-site
   ```
3. Open the `public/index.html` file in a web browser to view the website.

## Usage

- Modify the HTML, CSS, and JavaScript files in the `public` directory to customize the website.
- Update the `docs/about.md` file for any additional documentation or information about the site.

## Ads & Analytics

This project includes scaffolding for web analytics and ad placement. By default the project contains placeholder snippets — you must replace the placeholder IDs with your own before publishing.

- Google Analytics (GA4): add your Measurement ID in `public/index.html` by replacing `G-XXXXXXXXXX` with your `G-` ID.
- Google AdSense (web): set your publisher ID (`ca-pub-...`) and ad unit IDs in the AdSense placeholders in `public/index.html`.
- AdMob (mobile): for Android/iOS builds use the AdMob SDK (via Capacitor/Android/iOS native integration). This repo only includes a web scaffold; mobile integration requires native configuration and is not included here.

Privacy note: if you use analytics and ads, ensure you provide any required privacy disclosures and consent mechanisms for users (GDPR/CCPA) before publishing.

## Admin UI

An admin page is available at `/admin.html` (when running the included `server.js`) to manage quiz JSON files. It lets you:

- List available quiz files stored under `public/quizzes/`.
- Upload new JSON quiz files (paste or upload file).
- Set any uploaded quiz as the active quiz for the main site (copies to `public/questions.json`).

Usage (local): run `node server.js` and open `http://localhost:3000/admin.html`.

## Publishing to GitHub Pages

You can publish the contents of the `public/` folder to GitHub Pages. Two common options:

1) Quick deploy with `gh-pages` (recommended for this repo):

   - Install dev dependency and publish:

```powershell
npm install --save-dev gh-pages
npm run deploy
```

   - The `deploy` script uses `npx gh-pages -d public` and will create/update the `gh-pages` branch for you.

   - Before running, set the `homepage` field in `package.json` to your GitHub Pages URL, for example:

```
"homepage": "https://your-github-username.github.io/your-repo-name"
```

2) Manual GitHub Pages (via repo settings):

   - Push your repository to GitHub.
   - In the repository Settings → Pages, choose the `gh-pages` branch (or `main` and `/docs` folder) as the source and save.

Privacy & Ads: If you add analytics or ads, make sure your privacy policy and consent banner (if required) are in place before publishing.

## License

This project is licensed under the Apache License 2.0.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

You may use and modify this code and monetize it (for example, with ads
or hosted services) provided you comply with the terms of the
Apache-2.0 license. See the [LICENSE](LICENSE) file for full details.