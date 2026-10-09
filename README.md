# sdmay27-14 Senior Design Website

A local copy of the Iowa State University ECpE senior design team website for
**sdmay27-14: 3D Plan Visualization: Automated Building Reconstruction and
Walkthrough Generator**.

It's a static site built on the Iowa State University theme (Bootstrap 3 +
jQuery). The page has a project overview, team member profiles, weekly reports,
and design documents. Reports and design documents open in an in-page viewer
rendered with [pdf.js](https://mozilla.github.io/pdf.js/).

> This is a standalone copy. Changes made here are **not** deployed to the live
> class website.

## Project structure

```
index.html               Main page
css/                     ISU theme styles (iastate.*.css) and site-specific styles (site.css)
js/documents.js          List of weekly reports and design documents shown on the page
js/site.js               Overview animation, document cards and the document viewer
js/                      ISU theme script and vendor libraries (Bootstrap, bootstrap-submenu)
docs/weekly-reports/     Weekly report PDFs
docs/design-documents/   Design document PDFs
img/team/                Team member photos
blank-profile.png        Placeholder team member photo
```

## Running locally

You need [Python 3](https://www.python.org/downloads/). Fonts, icons, jQuery and
pdf.js load from CDNs, so you also need an internet connection for the page to look right.

### With make

```bash
make serve
```

Then open <http://localhost:8000>. To use a different port:

```bash
make serve PORT=9000
```

On Windows, `make` isn't installed by default. You can install it with
`winget install ezwinports.make` (or `choco install make`), then restart your
terminal.

### Without make

```bash
python -m http.server 8000 --bind 127.0.0.1
```

(Use `python3` on macOS/Linux.) Then open <http://localhost:8000>.

## Deploying to GitHub Pages

The site is plain static files with relative paths, so it can be served straight
from the repository.

1. Go to <https://github.com/ku1p3r/sdmay27-14-website/settings/pages>.
2. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
3. Set **Branch** to `main` and the folder to `/ (root)`, then click **Save**.
4. Wait a minute for the first build, then open
   <https://ku1p3r.github.io/sdmay27-14-website/>.

Every push to `main` republishes the site. The empty `.nojekyll` file at the repo
root tells GitHub to publish the files as-is instead of running them through Jekyll.

## Editing

- Page content: `index.html`
- Custom styles: `css/site.css` (leave the `iastate.*` theme files unchanged)

### Adding a weekly report or design document

1. Put the PDF in `docs/weekly-reports/` or `docs/design-documents/`.
2. Add a line for it at the top of the matching list in `js/documents.js`:

   ```js
   { title: 'Weekly Report 4', dates: 'Oct 7 – Oct 13, 2026', file: 'docs/weekly-reports/weekly-report-04.pdf' },
   ```

The preview thumbnail and page count are generated from the PDF automatically.

### Adding a team member photo or bio

Save the photo in `img/team/`, then in that member's block in `index.html` change
the `<img src="blank-profile.png">` to point at it and fill in the
`sd-member-bio` paragraph.

The server serves files straight from disk, so refresh the browser to see changes.
