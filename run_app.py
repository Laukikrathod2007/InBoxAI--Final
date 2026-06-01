import threading
import uvicorn
import time
import webbrowser
import socket
from src.main import app

def get_local_ip():
    """Returns the local network IP address."""
    try:
        # Create a dummy connection to a public IP to find the local interface IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

def run_server():
    print("Starting InBoxIQ Dashboard Server...")
    # host="0.0.0.0" makes the server accessible across the local network
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="error")

if __name__ == "__main__":
    local_ip = get_local_ip()
    
    # 1. Start Server in thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # 2. Wait a bit for server to warm up
    time.sleep(2)
    
    # 3. Display Connection Info
    print("\n" + "="*50)
    print("InBoxIQ AI Work OS is now running!")
    print("="*50)
    print(f"Local Access:   http://localhost:8001")
    print(f"Network Access: http://{local_ip}:8001")
    print("="*50 + "\n")
    
    # 4. Open Browser locally
    webbrowser.open("http://localhost:8001")
    
    # 5. Keep launcher process alive while server runs in daemon thread.
    while True:
        time.sleep(1)
