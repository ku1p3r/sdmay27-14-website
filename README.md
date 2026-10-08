# sdmay27-14 Senior Design Website

A local copy of the Iowa State University ECpE senior design team website for
**sdmay27-14: 3D Plan Visualization: Automated Building Reconstruction and
Walkthrough Generator**.

It's a static site built on the Iowa State University theme (Bootstrap 3 +
jQuery). The page has a project overview, team member profiles, weekly reports,
and design documents.

> This is a standalone copy. Changes made here are **not** deployed to the live
> class website.

## Project structure

```
index.html          Main page
css/                ISU theme styles (iastate.*.css) and site-specific styles (site.css)
js/                 ISU theme script and vendor libraries (Bootstrap, bootstrap-submenu)
blank-profile.png   Placeholder team member photo
sample-doc.pdf      Placeholder report/design document
```

## Running locally

You need [Python 3](https://www.python.org/downloads/). Fonts, icons, and jQuery
load from CDNs, so you also need an internet connection for the page to look right.

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

## Editing

- Page content: `index.html`
- Custom styles: `css/site.css` (leave the `iastate.*` theme files unchanged)

The server serves files straight from disk, so refresh the browser to see changes.
