#!/usr/bin/env python3
"""
Simple HTTP Server with Auto-Open in Edge
Double-click this file to start the server and open the app in Microsoft Edge
"""

import http.server
import socketserver
import webbrowser
import socket
import os
import sys
import time
from threading import Timer

def find_free_port(start_port=8000, max_attempts=100):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"Could not find a free port in range {start_port}-{start_port + max_attempts}")

def open_browser(url):
    """Open the URL in Microsoft Edge"""
    # Edge executable paths
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]

    # Try to register Edge
    edge_path = None
    for path in edge_paths:
        if os.path.exists(path):
            edge_path = path
            break

    if edge_path:
        # Register Edge with webbrowser
        webbrowser.register('edge', None, webbrowser.BackgroundBrowser(edge_path))
        webbrowser.get('edge').open(url)
    else:
        # Fallback to default browser
        print("Edge not found, opening in default browser...")
        webbrowser.open(url)

def main():
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    # Find available port
    port = find_free_port()

    # Set up the server
    Handler = http.server.SimpleHTTPRequestHandler

    # Disable logging to reduce console clutter (optional)
    # Handler.log_message = lambda *args: None

    with socketserver.TCPServer(("", port), Handler) as httpd:
        url = f"http://localhost:{port}"

        print("=" * 60)
        print(f"Server started successfully!")
        print(f"Opening: {url}")
        print(f"Port: {port}")
        print("=" * 60)
        print("\nPress Ctrl+C to stop the server")
        print("=" * 60)

        # Open browser after a short delay
        Timer(1.5, lambda: open_browser(url)).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nShutting down server...")
            httpd.shutdown()
            sys.exit(0)

if __name__ == "__main__":
    main()
