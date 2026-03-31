# MwambaPOS Standalone Build Script
# Creates a portable Windows executable without requiring Python installation

import os
import sys
import subprocess
import shutil
import urllib.request
import zipfile
import tarfile

def run_command(cmd, cwd=None, capture=True):
    """Run a command and print output"""
    print(f"Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    if capture:
        result = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}")
            return result.returncode
        return 0
    else:
        result = subprocess.run(cmd, cwd=cwd, shell=True)
        return result.returncode

def download_file(url, dest):
    """Download a file with progress"""
    print(f"Downloading {url}...")
    def report_progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        percent = min(100, downloaded * 100 // total_size) if total_size > 0 else 0
        print(f"\rProgress: {percent}%", end='', flush=True)
    
    urllib.request.urlretrieve(url, dest, reporthook=report_progress)
    print()  # New line after progress

def main():
    # Get the project root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    electron_dir = script_dir
    pos_dir = os.path.join(project_root, 'pos')
    backend_dir = os.path.join(project_root, 'POS-BACKEND')
    
    print("=" * 60)
    print("MwambaPOS Standalone Desktop Build Script")
    print("=" * 60)
    
    # Create directories
    portable_python_dir = os.path.join(electron_dir, 'python-portable')
    python_dir = os.path.join(electron_dir, 'python')
    os.makedirs(portable_python_dir, exist_ok=True)
    os.makedirs(python_dir, exist_ok=True)
    
    # Step 1: Build React frontend
    print("\n[1/5] Building React frontend...")
    if os.path.exists(os.path.join(pos_dir, 'build')):
        shutil.rmtree(os.path.join(pos_dir, 'build'))
    run_command("npm install", cwd=pos_dir)
    run_command("npm run build", cwd=pos_dir)
    
    # Step 2: Download and setup portable Python
    print("\n[2/5] Setting up portable Python...")
    
    python_exe = os.path.join(portable_python_dir, 'python.exe')
    
    if not os.path.exists(python_exe):
        # Download Python embeddable package (smaller, portable)
        python_version = "3.11.9"
        python_url = f"https://www.python.org/ftp/python/{python_version}/python-{python_version}-embed-amd64.zip"
        python_zip = os.path.join(electron_dir, "python-embed.zip")
        
        if not os.path.exists(python_zip):
            download_file(python_url, python_zip)
        
        print("Extracting Python...")
        with zipfile.ZipFile(python_zip, 'r') as zip_ref:
            zip_ref.extractall(portable_python_dir)
        
        # Remove the zip file
        os.remove(python_zip)
    else:
        print("Python already exists, skipping download.")
    
    # Step 3: Install pip and dependencies
    print("\n[3/5] Installing Python dependencies...")
    
    # Get ensurepip for pip installation
    ensure_pip_script = os.path.join(portable_python_dir, 'ensurepip.py')
    if not os.path.exists(ensure_pip_script):
        # Download get-pip.py
        get_pip_url = "https://bootstrap.pypa.io/get-pip.py"
        get_pip_file = os.path.join(electron_dir, "get-pip.py")
        download_file(get_pip_url, get_pip_file)
        
        # Run get-pip.py
        run_command(f'"{python_exe}" "{get_pip_file}"', cwd=portable_python_dir)
        os.remove(get_pip_file)
    
    # Copy requirements to backend directory and install
    req_file = os.path.join(backend_dir, 'requirements.txt')
    if os.path.exists(req_file):
        # Install dependencies using the portable Python
        pip_exe = os.path.join(portable_python_dir, 'Scripts', 'pip.exe')
        if not os.path.exists(pip_exe):
            pip_exe = os.path.join(portable_python_dir, 'Scripts', 'pip3.exe')
        
        if os.path.exists(pip_exe):
            run_command(f'"{pip_exe}" install --upgrade pip', cwd=portable_python_dir)
            run_command(f'"{pip_exe}" install wheel', cwd=portable_python_dir)
            run_command(f'"{pip_exe}" install -r "{req_file}"', cwd=portable_python_dir)
        else:
            print("WARNING: pip not found, trying alternative method...")
            # Try with python -m pip
            run_command(f'"{python_exe}" -m pip install --upgrade pip', cwd=portable_python_dir)
            run_command(f'"{python_exe}" -m pip install wheel', cwd=portable_python_dir)
            run_command(f'"{python_exe}" -m pip install -r "{req_file}"', cwd=portable_python_dir)
    
    # Step 4: Copy portable Python to electron directory
    print("\n[4/5] Preparing bundled Python...")
    
    # Copy the portable Python to the final location
    if os.path.exists(python_dir):
        shutil.rmtree(python_dir)
    
    # Copy only essential files
    print("Copying portable Python...")
    for item in os.listdir(portable_python_dir):
        src = os.path.join(portable_python_dir, item)
        dst = os.path.join(python_dir, item)
        if os.path.isdir(src):
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
    
    # Step 5: Build Electron app
    print("\n[5/5] Building Electron app...")
    
    # Install Electron dependencies
    run_command("npm install", cwd=electron_dir)
    
    # Build the Electron app (portable exe)
    run_command("npm run build:portable", cwd=electron_dir)
    
    print("\n" + "=" * 60)
    print("Build complete!")
    print(f"Executable location: {os.path.join(electron_dir, 'dist')}")
    print("=" * 60)
    print("\nTo run the app, simply double-click MwambaPOS.exe")

if __name__ == '__main__':
    main()
