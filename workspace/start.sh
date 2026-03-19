#!/bin/bash
# MONI 3D Workspace — Local Development Server
# Serves the workspace on http://localhost:8080

PORT="${1:-8080}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   🔍 MONI 3D WORKSPACE              ║"
echo "  ║   Agent Command Center               ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# Try Node.js first, then Python
if command -v node &> /dev/null; then
  echo "  Server: Node.js ($(node -v))"
  echo "  URL:    http://localhost:${PORT}"
  echo "  Dir:    ${DIR}"
  echo ""
  echo "  Press Ctrl+C to stop"
  echo ""
  node -e "
    const http = require('http');
    const fs = require('fs');
    const path = require('path');
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff2': 'font/woff2'
    };
    http.createServer((req, res) => {
      let filePath = path.join('${DIR}', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(500);
            res.end('Server Error');
          }
        } else {
          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(content);
        }
      });
    }).listen(${PORT}, () => {
      console.log('  Serving at http://localhost:${PORT}');
    });
  "
elif command -v python3 &> /dev/null; then
  echo "  Server: Python $(python3 --version 2>&1 | cut -d' ' -f2)"
  echo "  URL:    http://localhost:${PORT}"
  echo "  Dir:    ${DIR}"
  echo ""
  echo "  Press Ctrl+C to stop"
  echo ""
  cd "$DIR" && python3 -m http.server "$PORT"
elif command -v python &> /dev/null; then
  echo "  Server: Python $(python --version 2>&1 | cut -d' ' -f2)"
  echo "  URL:    http://localhost:${PORT}"
  echo "  Dir:    ${DIR}"
  echo ""
  echo "  Press Ctrl+C to stop"
  echo ""
  cd "$DIR" && python -m http.server "$PORT"
else
  echo "  ❌ No server runtime found. Install Node.js or Python."
  exit 1
fi
