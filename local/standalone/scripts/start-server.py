#!/usr/bin/env python3
"""
Simple Local Server for HKIT Course Analyzer
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

def start_server(port=8000):
    """Start local HTTP server"""
    
    # Change to the directory containing this script
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Create server
    handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"🚀 Starting HKIT Course Analyzer Local Server...")
            print(f"📍 Server running at: http://localhost:{port}")
            print(f"📂 Serving files from: {script_dir}")
            print(f"🌐 Opening browser...")
            print(f"⏹️  Press Ctrl+C to stop the server")
            
            # Open browser
            webbrowser.open(f"http://localhost:{port}")
            
            # Start server
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print(f"\n✅ Server stopped")
        sys.exit(0)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {port} is already in use. Trying port {port + 1}...")
            start_server(port + 1)
        else:
            print(f"❌ Error starting server: {e}")
            sys.exit(1)

if __name__ == "__main__":
    start_server()
