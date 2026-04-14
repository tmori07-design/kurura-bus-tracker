#!/usr/bin/env python3
"""Preview: serve public/ locally, proxy /api/* to live Netlify for verification."""
import http.server
import os
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

PORT = 3000
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
UPSTREAM = 'https://ubiquitous-dasik-3ee5a8.netlify.app'


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        if self.path.startswith('/api/'):
            self._proxy()
            return
        super().do_GET()

    def _proxy(self):
        url = UPSTREAM + self.path
        try:
            req = Request(url, headers={'User-Agent': 'preview-proxy'})
            with urlopen(req, timeout=30) as up:
                self.send_response(up.status)
                for k, v in up.getheaders():
                    if k.lower() in ('transfer-encoding', 'connection'):
                        continue
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(up.read())
        except HTTPError as e:
            self.send_response(e.code)
            self.end_headers()
            self.wfile.write(e.read())
        except URLError as e:
            self.send_response(502)
            self.end_headers()
            self.wfile.write(str(e).encode())


if __name__ == '__main__':
    os.chdir(PUBLIC_DIR)
    with http.server.ThreadingHTTPServer(('', PORT), Handler) as srv:
        print(f'preview proxy on http://localhost:{PORT} → {UPSTREAM}')
        srv.serve_forever()
