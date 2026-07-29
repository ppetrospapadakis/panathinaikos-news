/**
 * api/app.js — Single Lambda Router (B4: Lambda Consolidation)
 *
 * All API endpoints consolidated into one Vercel Serverless Function to eliminate
 * cold-start penalties on every independent function invocation.
 *
 * Route map:
 *   GET  /api/articles         → articles handler
 *   ALL  /api/comments         → comments handler
 *   ALL  /api/admin-stats      → admin-stats handler
 *   GET  /api/feed             → feed handler  (also: /feed.xml)
 *   GET  /api/sitemap          → sitemap handler (also: /sitemap.xml)
 *   GET  /api/scrape           → scrape handler
 *   GET  /api/ping             → inline pong
 *   ALL  /api/sys/social-sync  → social-sync handler
 *   GET  /api/render-article   → article SSR (also: /:category/:slug-id=:id)
 *   GET  /api/render-index     → index SSR   (also: /)
 */

const express = require('express');
const app = express();

// Parse JSON bodies (needed for POST endpoints like comments)
app.use(express.json());

// ── Standard /api/* routes ──────────────────────────────────────────────────

app.all('/api/articles',        require('./articles'));
app.all('/api/comments',        require('./comments'));
app.all('/api/admin-stats',     require('./admin-stats'));
app.all('/api/feed',            require('./feed'));
app.all('/api/sitemap',         require('./sitemap'));
app.all('/api/scrape',          require('./scrape'));
app.all('/api/render-article',  require('./render-article'));
app.all('/api/render-index',    require('./render-index'));
app.all('/api/sys/social-sync', require('./sys/social-sync'));

app.get('/api/ping', (req, res) => res.status(200).send('pong'));

// ── Path-aliased routes (from vercel.json rewrites) ─────────────────────────
// /sitemap.xml and /feed.xml rewrite to /api/app directly

app.get('/sitemap.xml', require('./sitemap'));
app.get('/feed.xml',    require('./feed'));

// ── SSR Routes via query param (from vercel.json rewrites) ──────────────────
// e.g. /api/app?route=render-article&id=xxx  or  /api/app?route=render-index

app.all('/api/app', (req, res, next) => {
    const route = req.query.route;
    if (route === 'render-article') return require('./render-article')(req, res);
    if (route === 'render-index')   return require('./render-index')(req, res);
    next();
});

// Fallback 404 for unknown /api/* routes
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

module.exports = app;
