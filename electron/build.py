# Build script for MwambaPOS Desktop Application
# This script creates a standalone Windows executable with bundled Python

import os
import sys
import subprocess
import shutil

def run_command(cmd, cwd=None):
    """Run a command and print output"""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd, shell=True)
    if result.returncode != 0:
        print(f"Error: Command failed with return code {result.returncode}")
        sys.exit(1)

def main():
    # Get the project root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    electron_dir = script_dir
    pos_dir = os.path.join(project_root, 'pos')
    backend_dir = os.path.join(project_root, 'POS-BACKEND')
    
    print("=" * 50)
    print("MwambaPOS Desktop Build Script")
    print("=" * 50)
    
    # Step 1: Build React frontend
    print("\n[1/4] Building React frontend...")
    run_command("npm run build", cwd=pos_dir)
    
    # Step 2: Create Django PyInstaller spec file
    print("\n[2/4] Creating PyInstaller configuration...")
    
    # Create a simple Django runner for PyInstaller
    django_runner = os.path.join(electron_dir, 'django_runner.py')
    with open(django_runner, 'w') as f:
        f.write('''
import sys
import os

# Add Django project to path
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
    django_path = os.path.join(base_path, 'django')
else:
    base_path = os.path.dirname(os.path.abspath(__file__))
    django_path = os.path.join(base_path, '..', 'POS-BACKEND')

sys.path.insert(0, django_path)
os.chdir(django_path)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myshop.settings')

# Run Django
from django.core.management import execute_from_command_line
execute_from_command_line(sys.argv)
''')
    
    # Step 3: Run PyInstaller to create standalone Python
    print("\n[3/4] Building standalone Python with Django...")
    
    # Create the python directory for bundled Python
    python_dir = os.path.join(electron_dir, 'python')
    os.makedirs(python_dir, exist_ok=True)
    
    # Create a spec file for PyInstaller
    spec_content = f'''
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['{django_runner.replace(chr(92), '/')}'],
    pathex=['{backend_dir.replace(chr(92), '/')}'],
    binaries=[],
    datas=[('{backend_dir.replace(chr(92), '/')}', 'django')],
    hiddenimports=[
        'django',
        'djangorestframework',
        'django.contrib',
        'rest_framework',
        'corsheaders',
        'django_filters',
        'django_redis',
        'djangorestframework_simplejwt',
        'psycopg2',
        'PyJWT',
        'qrcode',
        'reportlab',
        'pillow',
    ],
    hookspath=[],
    hooksconfig={{}},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='python',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlementscoll = COLLECT_file=None,
)

(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='python',
)
'''
    
    spec_file = os.path.join(electron_dir, 'django_build.spec')
    with open(spec_file, 'w') as f:
        f.write(spec_content)
    
    # Run PyInstaller
    run_command(f'pyinstaller "{spec_file}" --distpath "{python_dir}" --workpath "{os.path.join(electron_dir, "build")}" --clean')
    
    # Step 4: Build Electron app
    print("\n[4/4] Building Electron app...")
    run_command("npm install", cwd=electron_dir)
    run_command("npm run build", cwd=electron_dir)
    
    print("\n" + "=" * 50)
    print("Build complete!")
    print(f"Executable: {os.path.join(electron_dir, 'dist', 'MwambaPOS.exe')}")
    print("=" * 50)

if __name__ == '__main__':
    main()
