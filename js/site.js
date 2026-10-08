/* sdmay27-14 site script: the sample_house.plan animation and the document lists/viewer. */
(function () {
	'use strict';

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ------------------------------------------------------------------
	   sample_house.plan: a floor plan that gets extruded into a 3D model
	   ------------------------------------------------------------------ */

	(function planModel() {
		var canvas = document.getElementById('plan-canvas');
		if (!canvas || !canvas.getContext) return;
		var ctx = canvas.getContext('2d');
		var card = canvas.closest('.sd-model');
		var steps = card.querySelectorAll('.sd-model-steps li');

		var C = {
			grid: 'rgba(36,71,107,0.08)',
			wall: '36,71,107',
			window: '74,144,194',
			door: '200,16,46',
			roof: '200,16,46',
			dim: '120,120,120',
			label: '150,150,150'
		};
		function rgba(c, a) { return 'rgba(' + c + ',' + a + ')'; }

		// Plan in meters. x: 0..W (left to right), z: 0..D (front to back), y: up.
		var W = 12, D = 9, H = 2.7, RIDGE = 2.3;
		var exterior = [
			[0, 0, 7.6, 0], [8.6, 0, 12, 0], [12, 0, 12, 9], [12, 9, 0, 9], [0, 9, 0, 0]
		];
		var interior = [
			[5, 0, 5, 3], [5, 4, 5, 5.4], [0, 5.4, 2.4, 5.4], [3.4, 5.4, 8.2, 5.4],
			[8.2, 5.4, 8.2, 9], [9.2, 5.4, 12, 5.4]
		];
		var windows = [
			[1.4, 0, 3.6, 0], [10, 0, 11.2, 0], [12, 1.8, 12, 3.8], [12, 6.6, 12, 8],
			[2, 9, 4.2, 9], [6, 9, 7.6, 9], [0, 6.4, 0, 8], [0, 1.6, 0, 3.8]
		];
		var door = [7.6, 0, 8.6, 0];
		var rooms = [
			['LIVING', 2.5, 2.7], ['KITCHEN', 8.5, 2.7], ['BEDROOM', 4.1, 7.2], ['BATH', 10.1, 7.2]
		];
		var planLines = exterior.concat(interior);

		var t = 0, last = 0, running = false, visible = true;
		var dragYaw = 0, dragPitch = 0, spin = 0, dragging = false, px = 0, py = 0;
		var width = 0, height = 0, dpr = 1;
		var BUILD_END = 6.2;

		function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
		function ease(v) { v = clamp(v); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; }
		function lerp(a, b, k) { return a + (b - a) * k; }

		function resize() {
			var r = canvas.getBoundingClientRect();
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			width = r.width; height = r.height;
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			draw();
		}

		var cam = { yaw: 0, pitch: Math.PI / 2, scale: 1, cy: 0 };
		function project(x, y, z) {
			x -= W / 2; z -= D / 2;
			var cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
			var rx = x * cy - z * sy;
			var rz = x * sy + z * cy;
			var cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
			var up = y * cp + rz * sp;
			var depth = y * sp - rz * cp;
			var f = 34 / (34 - depth);
			return [width / 2 + rx * f * cam.scale, cam.cy - up * f * cam.scale];
		}

		function line(a, b, color, w) {
			ctx.strokeStyle = color;
			ctx.lineWidth = w || 1;
			ctx.beginPath();
			ctx.moveTo(a[0], a[1]);
			ctx.lineTo(b[0], b[1]);
			ctx.stroke();
		}
		function poly(pts, fill, stroke, w) {
			ctx.beginPath();
			ctx.moveTo(pts[0][0], pts[0][1]);
			for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
			ctx.closePath();
			if (fill) { ctx.fillStyle = fill; ctx.fill(); }
			if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w || 1; ctx.stroke(); }
		}
		function label(text, p, color) {
			ctx.fillStyle = color;
			ctx.font = '11px Menlo, Consolas, "Courier New", monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(text, p[0], p[1]);
		}

		function draw() {
			if (!width) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, width, height);
			ctx.lineCap = 'round';

			var pPlan = clamp(t / 2.0);
			var pTilt = ease((t - 2.0) / 1.6);
			var pWall = ease((t - 3.3) / 1.4);
			var pRoof = ease((t - 4.6) / 1.3);

			cam.scale = Math.min(width, height * 1.25) / lerp(16, 19, pTilt);
			cam.pitch = Math.max(0.12, Math.min(Math.PI / 2, lerp(Math.PI / 2, 0.52, pTilt) + dragPitch));
			cam.yaw = lerp(0, -0.62, pTilt) + spin + dragYaw;
			cam.cy = height * lerp(0.5, 0.6, pTilt);

			// ground grid
			var g;
			for (g = -2; g <= W + 2; g++) line(project(g, 0, -2), project(g, 0, D + 2), C.grid);
			for (g = -2; g <= D + 2; g++) line(project(-2, 0, g), project(W + 2, 0, g), C.grid);

			// floor
			poly([project(0, 0, 0), project(W, 0, 0), project(W, 0, D), project(0, 0, D)], rgba(C.wall, 0.04 + 0.03 * pWall));

			// plan lines, drawn in one after another
			var n = planLines.length;
			planLines.forEach(function (s, i) {
				var k = clamp((pPlan * (n + 3) - i) / 3);
				if (k <= 0) return;
				var ext = i < exterior.length;
				line(project(s[0], 0, s[1]), project(lerp(s[0], s[2], k), 0, lerp(s[1], s[3], k)),
					rgba(C.wall, ext ? 0.95 : 0.6), ext ? 2.2 : 1.3);
			});

			// dimensions and room names while it's still a flat plan
			var ann = clamp(pPlan * 1.4 - 0.3) * (1 - pTilt);
			if (ann > 0.01) {
				var dim = rgba(C.dim, ann);
				line(project(0, 0, -1.1), project(W, 0, -1.1), dim);
				line(project(0, 0, -0.8), project(0, 0, -1.4), dim);
				line(project(W, 0, -0.8), project(W, 0, -1.4), dim);
				label('12.00 m', project(W / 2, 0, -1.65), dim);
				line(project(W + 1.1, 0, 0), project(W + 1.1, 0, D), dim);
				line(project(W + 0.8, 0, 0), project(W + 1.4, 0, 0), dim);
				line(project(W + 0.8, 0, D), project(W + 1.4, 0, D), dim);
				ctx.save();
				var m = project(W + 1.75, 0, D / 2);
				ctx.translate(m[0], m[1]);
				ctx.rotate(-Math.PI / 2);
				label('9.00 m', [0, 0], dim);
				ctx.restore();
				rooms.forEach(function (r) { label(r[0], project(r[1], 0, r[2]), rgba(C.label, ann)); });
				var hinge = project(door[0], 0, door[1]);
				var rad = Math.abs(project(door[2], 0, 0)[0] - hinge[0]);
				ctx.strokeStyle = rgba(C.door, ann);
				ctx.lineWidth = 1.2;
				ctx.beginPath();
				ctx.arc(hinge[0], hinge[1], rad, -Math.PI / 2, 0);
				ctx.stroke();
				line(hinge, [hinge[0], hinge[1] - rad], rgba(C.door, ann), 1.2);
			}

			// walls
			var h = H * pWall;
			if (h > 0.01) {
				planLines.forEach(function (s, i) {
					var ext = i < exterior.length;
					var a0 = project(s[0], 0, s[1]), b0 = project(s[2], 0, s[3]);
					var a1 = project(s[0], h, s[1]), b1 = project(s[2], h, s[3]);
					poly([a0, b0, b1, a1], rgba(C.wall, ext ? 0.07 : 0.035));
					var col = rgba(C.wall, ext ? 0.9 : 0.4);
					line(a1, b1, col, ext ? 1.6 : 1.1);
					line(a0, a1, col, ext ? 1.3 : 1);
					line(b0, b1, col, ext ? 1.3 : 1);
				});
				windows.forEach(function (w) {
					var sill = 0.9, head = Math.min(2.1, h);
					if (head <= sill) return;
					poly([project(w[0], sill, w[1]), project(w[2], sill, w[3]), project(w[2], head, w[3]), project(w[0], head, w[1])],
						rgba(C.window, 0.18), rgba(C.window, 0.9), 1.2);
				});
				var dh = Math.min(2.1, h);
				poly([project(door[0], 0, door[1]), project(door[2], 0, door[3]), project(door[2], dh, door[3]), project(door[0], dh, door[1])],
					rgba(C.door, 0.15), rgba(C.door, 0.9), 1.4);
			}

			// gable roof, ridge along x
			if (pRoof > 0.01) {
				var r = H + RIDGE * pRoof, o = 0.35, a = pRoof;
				var fl = project(-o, H, -o), fr = project(W + o, H, -o), bl = project(-o, H, D + o), br = project(W + o, H, D + o);
				var rl = project(-o, r, D / 2), rr = project(W + o, r, D / 2);
				poly([fl, fr, rr, rl], rgba(C.roof, 0.07 * a), rgba(C.roof, 0.85 * a), 1.4);
				poly([bl, br, rr, rl], rgba(C.roof, 0.04 * a), rgba(C.roof, 0.6 * a), 1.2);
				poly([project(0, H, 0), project(0, r, D / 2), project(0, H, D)], rgba(C.wall, 0.05 * a), rgba(C.wall, 0.5 * a), 1);
				poly([project(W, H, 0), project(W, r, D / 2), project(W, H, D)], rgba(C.wall, 0.05 * a), rgba(C.wall, 0.5 * a), 1);
				for (var x = 1.5; x < W; x += 1.5) {
					line(project(x, H, -o), project(x, r, D / 2), rgba(C.roof, 0.2 * a));
					line(project(x, H, D + o), project(x, r, D / 2), rgba(C.roof, 0.12 * a));
				}
			}

			var stage = pPlan < 1 ? 0 : pWall < 1 ? 1 : pRoof < 1 ? 2 : 3;
			for (var i = 0; i < steps.length; i++) {
				steps[i].classList.toggle('is-active', i === stage);
				steps[i].classList.toggle('is-done', i < stage);
			}
			card.classList.toggle('is-built', stage === 3);
		}

		function frame(now) {
			if (!running) return;
			var dt = Math.min(0.05, (now - last) / 1000 || 0);
			last = now;
			t += dt;
			if (t > BUILD_END && !dragging) spin -= dt * 0.15;
			draw();
			requestAnimationFrame(frame);
		}
		function start() {
			if (running || reduceMotion || !visible) return;
			running = true;
			last = performance.now();
			requestAnimationFrame(frame);
		}

		canvas.addEventListener('pointerdown', function (e) {
			dragging = true; px = e.clientX; py = e.clientY;
			canvas.classList.add('is-dragging');
			canvas.setPointerCapture(e.pointerId);
			if (t < BUILD_END) t = BUILD_END;
		});
		canvas.addEventListener('pointermove', function (e) {
			if (!dragging) return;
			dragYaw += (e.clientX - px) * 0.008;
			dragPitch = Math.max(-0.4, Math.min(1, dragPitch + (e.clientY - py) * 0.005));
			px = e.clientX; py = e.clientY;
			if (!running) draw();
		});
		function endDrag() { dragging = false; canvas.classList.remove('is-dragging'); }
		canvas.addEventListener('pointerup', endDrag);
		canvas.addEventListener('pointercancel', endDrag);

		card.querySelector('.sd-model-replay').addEventListener('click', function () {
			t = reduceMotion ? 99 : 0;
			spin = dragYaw = dragPitch = 0;
			draw();
			start();
		});

		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (entries) {
				visible = entries[0].isIntersecting;
				if (visible) start(); else running = false;
			}).observe(canvas);
		}
		if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
		else window.addEventListener('resize', resize);

		if (reduceMotion) t = 99;
		resize();
		start();
	})();

	/* ------------------------------------------------------------------
	   Weekly reports and design documents (listed in js/documents.js)
	   ------------------------------------------------------------------ */

	var pdfjs = window.pdfjsLib;
	if (pdfjs) {
		pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
	}
	var pdfCache = {};
	function loadPdf(file) {
		if (!pdfCache[file]) pdfCache[file] = pdfjs.getDocument(file).promise;
		return pdfCache[file];
	}

	// Render one PDF page into a canvas at the canvas's displayed width.
	function renderPage(pdf, number, canvas) {
		return pdf.getPage(number).then(function (page) {
			var cssWidth = canvas.parentNode.clientWidth || 300;
			var scale = cssWidth * Math.min(window.devicePixelRatio || 1, 2) / page.getViewport({ scale: 1 }).width;
			var viewport = page.getViewport({ scale: scale });
			canvas.width = Math.floor(viewport.width);
			canvas.height = Math.floor(viewport.height);
			return page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
		});
	}

	function onVisible(el, callback, root) {
		if (!('IntersectionObserver' in window)) { callback(); return; }
		var io = new IntersectionObserver(function (entries) {
			if (entries[0].isIntersecting) { io.disconnect(); callback(); }
		}, { root: root || null, rootMargin: '300px 0px' });
		io.observe(el);
	}

	var lists = window.SITE_DOCUMENTS || {};
	document.querySelectorAll('.sd-docs').forEach(function (container) {
		var docs = lists[container.dataset.docs] || [];
		if (!docs.length) {
			var empty = document.createElement('p');
			empty.className = 'sd-empty';
			empty.textContent = container.dataset.empty || 'Nothing here yet.';
			container.appendChild(empty);
			return;
		}
		docs.forEach(function (doc) {
			var card = document.createElement('a');
			card.className = 'sd-doc';
			card.href = doc.file;
			card.target = '_blank';
			card.rel = 'noopener';
			card.innerHTML =
				'<span class="sd-doc-thumb"><span class="sd-doc-icon"><i class="far fa-file-pdf"></i></span><canvas></canvas></span>' +
				'<span class="sd-doc-title"></span><span class="sd-doc-meta"></span>';
			card.querySelector('.sd-doc-title').textContent = doc.title;
			var meta = card.querySelector('.sd-doc-meta');
			meta.textContent = doc.dates || '';
			container.appendChild(card);

			if (!pdfjs) return; // without pdf.js the card just opens the PDF
			onVisible(card, function () {
				var thumb = card.querySelector('.sd-doc-thumb');
				loadPdf(doc.file).then(function (pdf) {
					meta.textContent = (doc.dates ? doc.dates + ' · ' : '') + pdf.numPages + (pdf.numPages === 1 ? ' page' : ' pages');
					return renderPage(pdf, 1, thumb.querySelector('canvas'));
				}).then(function () {
					thumb.classList.add('is-loaded');
				}).catch(function () { /* keep the file icon */ });
			});
			card.addEventListener('click', function (e) {
				if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
				if (!viewer.open) return;
				e.preventDefault();
				viewer.open(doc);
			});
		});
	});

	/* ------------------------------------------------------------------
	   Document viewer
	   ------------------------------------------------------------------ */

	var viewer = (function () {
		var dialog = document.getElementById('doc-viewer');
		if (!pdfjs || !dialog || typeof dialog.showModal !== 'function') return {};

		var pagesEl = dialog.querySelector('.sd-viewer-pages');
		var titleEl = dialog.querySelector('.sd-viewer-title');
		var subEl = dialog.querySelector('.sd-viewer-sub');
		var current = null;

		function open(doc) {
			current = doc.file;
			titleEl.textContent = doc.title;
			subEl.textContent = doc.dates || '';
			dialog.querySelector('#sd-viewer-open').href = doc.file;
			dialog.querySelector('#sd-viewer-download').href = doc.file;
			pagesEl.innerHTML = '';
			document.documentElement.style.overflow = 'hidden';
			dialog.showModal();
			pagesEl.scrollTop = 0;
			pagesEl.focus({ preventScroll: true }); // lets arrow keys / space scroll the pages

			loadPdf(doc.file).then(function (pdf) {
				if (current !== doc.file) return;
				return pdf.getPage(1).then(function (first) {
					var vp = first.getViewport({ scale: 1 });
					for (var n = 1; n <= pdf.numPages; n++) {
						var page = document.createElement('div');
						page.className = 'sd-page';
						page.style.aspectRatio = vp.width + ' / ' + vp.height;
						var canvas = document.createElement('canvas');
						canvas.setAttribute('aria-label', 'Page ' + n + ' of ' + pdf.numPages);
						page.appendChild(canvas);
						pagesEl.appendChild(page);
						onVisible(page, renderPage.bind(null, pdf, n, canvas), pagesEl);
					}
				});
			}).catch(function () {
				// Couldn't render it here; fall back to opening the PDF directly.
				dialog.close();
				window.open(doc.file, '_blank', 'noopener');
			});
		}

		dialog.querySelector('.sd-viewer-close').addEventListener('click', function () { dialog.close(); });
		dialog.addEventListener('click', function (e) {
			if (e.target === dialog) dialog.close(); // click on the backdrop
		});
		dialog.addEventListener('close', function () {
			current = null;
			pagesEl.innerHTML = '';
			document.documentElement.style.overflow = '';
		});

		return { open: open };
	})();
})();
