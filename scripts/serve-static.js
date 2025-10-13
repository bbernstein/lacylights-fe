#!/usr/bin/env node

/**
 * Static file server that mimics nginx routing for LacyLights static export
 *
 * This server replicates the nginx configuration used in production on Raspberry Pi,
 * allowing local testing of the static export with the same routing behavior.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const OUT_DIR = path.join(__dirname, '..', 'out');

// MIME types for common files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
}

function routeRequest(req, res) {
  const url = req.url.split('?')[0]; // Remove query params for routing

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Static files with caching (/_next/static/)
  if (url.startsWith('/_next/static/')) {
    const filePath = path.join(OUT_DIR, url);
    if (fs.existsSync(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      serveFile(res, filePath);
      return;
    }
  }

  // Exact match for /cue-lists/ list page (serves /cue-lists/index.html)
  if (url === '/cue-lists' || url === '/cue-lists/') {
    const filePath = path.join(OUT_DIR, 'cue-lists', 'index.html');
    if (fs.existsSync(filePath)) {
      console.log(`  → Serving cue lists list page: ${filePath}`);
      serveFile(res, filePath);
      return;
    }
  }

  // Exact match for /player/ list page (serves /player/index.html)
  if (url === '/player' || url === '/player/') {
    const filePath = path.join(OUT_DIR, 'player', 'index.html');
    if (fs.existsSync(filePath)) {
      console.log(`  → Serving player list page: ${filePath}`);
      serveFile(res, filePath);
      return;
    }
  }

  // Handle /cue-lists/[id] dynamic routes (serves /cue-lists/__dynamic__/index.html)
  // Match /cue-lists/123 but NOT /cue-lists/ or /cue-lists/123/something
  const cueListMatch = url.match(/^\/cue-lists\/([^\/]+)$/);
  if (cueListMatch) {
    const filePath = path.join(OUT_DIR, 'cue-lists', '__dynamic__', 'index.html');
    if (fs.existsSync(filePath)) {
      console.log(`  → Serving cue list dynamic route: ${filePath} (for ID: ${cueListMatch[1]})`);
      serveFile(res, filePath);
      return;
    }
  }

  // Handle /player/[cueListId] dynamic routes (serves /player/__dynamic__/index.html)
  const playerMatch = url.match(/^\/player\/([^\/]+)$/);
  if (playerMatch) {
    const filePath = path.join(OUT_DIR, 'player', '__dynamic__', 'index.html');
    if (fs.existsSync(filePath)) {
      console.log(`  → Serving player dynamic route: ${filePath} (for ID: ${playerMatch[1]})`);
      serveFile(res, filePath);
      return;
    }
  }

  // Try exact file path first
  let filePath = path.join(OUT_DIR, url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath);
    return;
  }

  // Try with .html extension (try_files $uri.html)
  const htmlPath = filePath + '.html';
  if (fs.existsSync(htmlPath)) {
    serveFile(res, htmlPath);
    return;
  }

  // Try as directory with index.html (try_files $uri/)
  const indexPath = path.join(filePath, 'index.html');
  if (fs.existsSync(indexPath)) {
    serveFile(res, indexPath);
    return;
  }

  // Fallback to /index.html for SPA routing
  const fallbackPath = path.join(OUT_DIR, 'index.html');
  if (fs.existsSync(fallbackPath)) {
    console.log(`  → Falling back to SPA index.html`);
    serveFile(res, fallbackPath);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
}

const server = http.createServer(routeRequest);

server.listen(PORT, () => {
  console.log('\n🎭 LacyLights Static Export Server');
  console.log('=====================================');
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${OUT_DIR}`);
  console.log('\nThis server mimics the nginx routing used in production.');
  console.log('Press Ctrl+C to stop.\n');
});
