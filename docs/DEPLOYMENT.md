# Deployment Guide — GitHub Pages Static Hosting

Since **MD Converter v2** is a static browser-based application with zero backend databases or server rendering, it can be deployed for free on **GitHub Pages**.

---

## 🌎 Deployment Steps

1.  **Commit Code**: Push all files to a repository named `md-converter` under your GitHub account/organization `thesor`.
2.  **Enable GitHub Pages**:
    *   Navigate to your repository page on GitHub.
    *   Click on **Settings** in the top navigation.
    *   Scroll down the left sidebar and click on **Pages** (under the "Code and automation" section).
    *   Under **Build and deployment**:
        *   Source: Choose **Deploy from a branch**.
        *   Branch: Select **main** and set directory to `/ (root)`.
    *   Click **Save**.
3.  **Verify Deployment**:
    *   After a few minutes, GitHub Actions will compile and deploy your page.
    *   A link will be shown at the top of the Pages section:
        `https://thesor.github.io/md-converter/`
    *   Visit the URL to check that CSS and Javascript load successfully.

---

## 🛠 Project Sub-path Design

When deploying a project to GitHub Pages under a user account, it will be hosted on a sub-path (`/md-converter/`) rather than the domain root (`/`). 

We have prepared the code to prevent resource loading failures (404s) due to this sub-path:
*   **Asset paths**: All CSS, JS, and library includes in `index.html` use relative paths:
    *   `./assets/css/app.css` instead of `/assets/css/app.css`
*   **PWA paths**: `manifest.json` and `service-worker.js` use relative path configurations:
    *   `"start_url": "./index.html"`
    *   `ASSETS` array in `service-worker.js` caches `./assets/css/app.css` etc.

---

## 🔌 Running Locally (Offline Web App)

For security restrictions (like sandbox environments), you can run MD Converter 100% locally:
1.  Double-click `index.html` on any device.
2.  Alternatively, serve it locally using a simple Python server:
    ```bash
    python -m http.server 8000
    ```
    And visit `http://localhost:8000`. Serving it via HTTP allows browser PWA service workers and OCR caches to operate with full storage permissions.
