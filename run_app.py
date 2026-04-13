import threading
import uvicorn
import time
import webbrowser
import os
from src.main import app
from src.worker import Worker

def run_server():
    print("🚀 Starting InBoxIQ Dashboard Server...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")

def run_worker():
    print("🤖 Starting InBoxIQ AI Worker...")
    worker = Worker()
    while True:
        try:
            worker.process_cycle()
        except Exception as e:
            print(f"Worker Error: {e}")
        time.sleep(60) # Poll every minute

if __name__ == "__main__":
    # 1. Start Server in thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # 2. Wait a bit for server to warm up
    time.sleep(2)
    
    # 3. Open Browser
    print("🌐 Opening Dashboard at http://localhost:8000")
    webbrowser.open("http://localhost:8000")
    
    # 4. Start Worker in main thread
    run_worker()
