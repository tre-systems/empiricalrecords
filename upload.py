#!/usr/bin/env python3
"""
Upload empirical records site to JustHost via FTPS.

SAFETY: This script ONLY uploads files listed in UPLOAD_MANIFEST.
It NEVER deletes or modifies any files on the server that aren't ours.
"""

import sys
import time
import urllib.request
import urllib.error
from ftplib import FTP_TLS, FTP
from pathlib import Path

LOCAL_DIR = Path(__file__).parent

SITE_URL = "https://www.empiricalrecords.com"

# --- Explicit manifest of files to upload ---
# Only these files/directories will be touched on the server.
UPLOAD_FILES = [
    ".htaccess",
    "index.html",
    "artist-csu.html",
    "artist-multivibrator.html",
    "artist-uv.html",
    "artist-dsb.html",
    "404.html",
    "favicon.ico",
    "robots.txt",
    "sitemap.xml",
]

UPLOAD_DIRS = [
    "css",
    "js",
    "images",
    "CSU",
    "Multivibrator",
    "UV",
    "DiscoSuicideBomber",
]

# Files/dirs to never upload
IGNORE = {
    ".git", ".wrangler", ".claude", ".env", ".env.example",
    "_headers", "_redirects", ".DS_Store", "upload.py",
    ".htaccess.bak", "__pycache__", ".gitignore",
}

# URLs to verify after deployment
VERIFY_URLS = [
    ("/", "homepage"),
    ("/artist-csu", "CSU page"),
    ("/artist-multivibrator", "Multivibrator page"),
    ("/artist-uv", "UV page"),
    ("/artist-dsb", "Disco Suicide Bomber page"),
    ("/css/style.css", "stylesheet"),
    ("/js/player.js", "player script"),
    ("/fau/", "fau directory (wife's content)"),
    ("/fau/wrongbienale7/cornucopeai.htm", "biennial page"),
]


def load_env():
    """Load configuration from .env file"""
    env_path = LOCAL_DIR / ".env"
    config = {}

    if not env_path.exists():
        print("Error: .env file not found!")
        print("Create one based on .env.example:")
        print("  cp .env.example .env")
        print("  # Then edit .env with your FTP credentials")
        sys.exit(1)

    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                config[key.strip()] = value.strip()

    return config


def ftp_connect(server, username, password):
    """Connect via FTPS (TLS), falling back to plain FTP with a warning"""
    try:
        ftp = FTP_TLS(server, timeout=30)
        ftp.login(username, password)
        ftp.prot_p()  # Secure data connection
        print("✓ Connected via FTPS (TLS)\n")
        return ftp
    except Exception:
        print("  ⚠️  FTPS failed, falling back to plain FTP (password sent unencrypted!)")
        ftp = FTP(server, timeout=30)
        ftp.login(username, password)
        print("✓ Connected via FTP\n")
        return ftp


def ensure_remote_dir(ftp, remote_path, base_dir):
    """Create remote directory if it doesn't exist (non-destructive)"""
    abs_path = f"{base_dir}/{remote_path}"
    try:
        ftp.cwd(abs_path)
        ftp.cwd(base_dir)
    except Exception:
        try:
            ftp.mkd(abs_path)
        except Exception:
            pass  # May already exist
        ftp.cwd(base_dir)


def upload_file(ftp, local_path, remote_path, base_dir):
    """Upload a single file using absolute path. Returns True on success."""
    file_size = local_path.stat().st_size
    size_str = f"{file_size / 1024:.1f} KB" if file_size < 1024 * 1024 else f"{file_size / (1024 * 1024):.2f} MB"
    print(f"  {remote_path} ({size_str})...", end=" ", flush=True)
    abs_path = f"{base_dir}/{remote_path}"
    try:
        with open(local_path, "rb") as f:
            ftp.storbinary(f"STOR {abs_path}", f)
        print("✓")
        return True
    except Exception as e:
        print(f"✗ {e}")
        return False


def upload_directory(ftp, local_dir, remote_base, base_dir, stats):
    """Recursively upload a directory (creates dirs, uploads files, never deletes)"""
    for item in sorted(local_dir.iterdir()):
        if item.name in IGNORE or item.name.startswith("."):
            continue

        remote_path = f"{remote_base}/{item.name}"

        if item.is_dir():
            ensure_remote_dir(ftp, remote_path, base_dir)
            upload_directory(ftp, item, remote_path, base_dir, stats)
        elif item.is_file():
            if upload_file(ftp, item, remote_path, base_dir):
                stats["ok"] += 1
            else:
                stats["fail"] += 1
                stats["failed_files"].append(remote_path)


def verify_deployment(skip_verify=False):
    """Check key URLs return HTTP 200 after deployment"""
    if skip_verify:
        return

    print("\n🔍 Verifying deployment (waiting 3s for propagation)...")
    time.sleep(3)

    all_ok = True
    for path, label in VERIFY_URLS:
        url = f"{SITE_URL}{path}"
        try:
            req = urllib.request.Request(url, method="HEAD",
                headers={"User-Agent": "empiricalrecords-deploy/1.0"})
            resp = urllib.request.urlopen(req, timeout=10)
            code = resp.getcode()
            if code == 200:
                print(f"  ✓ {code} {label}")
            else:
                print(f"  ⚠️  {code} {label}")
                all_ok = False
        except urllib.error.HTTPError as e:
            print(f"  ✗ {e.code} {label} — {url}")
            all_ok = False
        except Exception as e:
            print(f"  ✗ {label} — {e}")
            all_ok = False

    if all_ok:
        print("\n✅ All verification checks passed!")
    else:
        print("\n⚠️  Some checks failed — review the output above")


def main():
    dry_run = "--dry-run" in sys.argv or "-n" in sys.argv
    skip_verify = "--no-verify" in sys.argv

    env = load_env()
    server = env.get("FTP_SERVER", "empiricalrecords.com")
    username = env.get("FTP_USERNAME", "")
    password = env.get("FTP_PASSWORD", "")
    remote_dir = env.get("FTP_REMOTE_DIR", "/public_html")

    if not username or not password:
        print("Error: FTP_USERNAME and FTP_PASSWORD must be set in .env")
        sys.exit(1)

    if dry_run:
        print("=== DRY RUN — no files will be uploaded ===\n")
        print(f"Server: {server}")
        print(f"Username: {username}")
        print(f"Remote dir: {remote_dir}")
        print(f"\nFiles to upload:")
        for f in UPLOAD_FILES:
            local = LOCAL_DIR / f
            if local.exists():
                print(f"  {f}")
        print(f"\nDirectories to upload:")
        for d in UPLOAD_DIRS:
            local = LOCAL_DIR / d
            if local.exists():
                count = sum(1 for _ in local.rglob("*") if _.is_file() and _.name not in IGNORE and not _.name.startswith("."))
                print(f"  {d}/ ({count} files)")
        return

    print(f"Connecting to {server} as {username}...")
    ftp = ftp_connect(server, username, password)

    # Change to the web root
    try:
        ftp.cwd(remote_dir)
        print(f"📁 Working directory: {ftp.pwd()}\n")
    except Exception as e:
        print(f"Error: Could not change to {remote_dir}: {e}")
        print("Check FTP_REMOTE_DIR in your .env file")
        ftp.quit()
        sys.exit(1)

    ftp.voidcmd("TYPE I")  # Binary mode

    base_dir = ftp.pwd()  # e.g. /public_html
    stats = {"ok": 0, "fail": 0, "failed_files": []}

    # Upload top-level files
    print("Uploading files:")
    for filename in UPLOAD_FILES:
        local_path = LOCAL_DIR / filename
        if local_path.exists():
            if upload_file(ftp, local_path, filename, base_dir):
                stats["ok"] += 1
            else:
                stats["fail"] += 1
                stats["failed_files"].append(filename)
        else:
            print(f"  ⚠️  {filename} not found locally, skipping")

    # Upload directories
    print("\nUploading directories:")
    for dirname in UPLOAD_DIRS:
        local_dir = LOCAL_DIR / dirname
        if local_dir.exists():
            print(f"\n  [{dirname}/]")
            ensure_remote_dir(ftp, dirname, base_dir)
            upload_directory(ftp, local_dir, dirname, base_dir, stats)
        else:
            print(f"  ⚠️  {dirname}/ not found locally, skipping")

    ftp.quit()

    print(f"\n{'=' * 50}")
    print(f"📊 Upload summary: {stats['ok']} succeeded, {stats['fail']} failed")
    if stats["failed_files"]:
        print(f"   Failed: {', '.join(stats['failed_files'])}")
        print(f"\n⚠️  Some files failed to upload — review errors above")
    else:
        print(f"   Site: {SITE_URL}/")

    # Post-deploy verification
    if stats["fail"] == 0:
        verify_deployment(skip_verify)
    else:
        print("\n⚠️  Skipping verification due to upload failures")


if __name__ == "__main__":
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: python upload.py [OPTIONS]")
        print()
        print("Options:")
        print("  --dry-run, -n    Show what would be uploaded without uploading")
        print("  --no-verify      Skip post-deploy HTTP verification")
        print("  --help, -h       Show this help message")
        sys.exit(0)
    main()
