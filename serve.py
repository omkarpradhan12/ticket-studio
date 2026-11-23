import mimetypes
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


mimetypes.add_type("text/javascript", ".js", strict=True)

root = Path(__file__).resolve().parent
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
server = ThreadingHTTPServer(("127.0.0.1", port), handler)

print(f"Serving Ticket Studio from {root} at http://127.0.0.1:{port}")
try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nStopping Ticket Studio server.")
finally:
    server.server_close()
