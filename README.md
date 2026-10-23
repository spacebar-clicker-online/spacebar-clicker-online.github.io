# Spacebar Clicker – static website

Plain HTML, CSS and JavaScript. No build step, no frameworks. Ready for GitHub Pages.

## Pages

| URL | Page |
|---|---|
| `/` | Spacebar Clicker (main tool) |
| `/spacebar-counter` | Spacebar Counter (endless + long timed modes) |
| `/cps-test` | Mouse CPS Test |
| `/guides` + 3 guides | How to press faster, good CPS, keyboards |
| `/about`, `/contact` | About, Contact |
| `/privacy-policy`, `/terms-and-conditions`, `/disclaimer` | Legal pages for AdSense |
| `/404.html`, `sitemap.xml`, `robots.txt`, `ads.txt` | Technical files |

## Before you upload

1. **Domain:** the site is set up for `https://spacebar-clicker-online.github.io`. If you use another GitHub username, find-and-replace `spacebar-clicker-online.github.io` with `YOURNAME.github.io` in all files (canonical tags, sitemap.xml, robots.txt).

## Deploy on GitHub Pages

1. Create a GitHub account with the organization **spacebar-clicker-online** (or the name you chose).
2. Create a new **public** repository named exactly `spacebar-clicker-online.github.io`.
3. Upload everything in this folder (including the hidden `.nojekyll` file) to the root of the repository.
4. Go to **Settings → Pages**, set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
5. After 1–2 minutes the site is live at `https://spacebar-clicker-online.github.io/`.
6. Keep **Issues** turned on (Settings → General → Features). The Contact page sends visitors there instead of email.

## Google Search Console

1. Add the property `https://spacebar-clicker-online.github.io/` (URL prefix).
2. Verify with the HTML tag method: paste the meta tag into the `<head>` of `index.html`.
3. Submit `sitemap.xml`.

## AdSense

1. Apply with your site URL.
2. Paste the AdSense `<script>` in every page where the comment `<!-- Google AdSense: paste ... -->` is (inside `<head>`).
3. Put your publisher line into `ads.txt` (replace the placeholder line).
4. Turn on Auto ads, and enable Google's consent message (CMP) for EEA/UK visitors under **Privacy & messaging**.

Tip: let the site get some Search Console impressions for 2–4 weeks before applying.
