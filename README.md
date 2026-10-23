# Rocsy website

The site at [rocsy.rocks](https://rocsy.rocks/) for [Rocsy](https://github.com/BittyBunnyBytes/Rocsy),
a self-hosted AI studio for AMD GPUs.

Plain static files (`index.html`, `styles.css`, `app.js`, `assets/`), published by the GitHub Pages
workflow on every push to `main`. The download buttons link to the latest Rocsy release; `app.js`
fills in its version and size from the GitHub API, with the releases page as the fallback. The GPU
queue on the page is an illustration, not live data.
