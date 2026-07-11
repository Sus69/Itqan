import os
import re
import time
import sys
import urllib.parse
import requests
from bs4 import BeautifulSoup

# Ensure standard output can handle unicode printing on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')


# Target directory
TARGET_DIR = r"C:\Users\manaa\Documents\appagent\Itqān\test1"
os.makedirs(TARGET_DIR, exist_ok=True)

# URL details
BASE_URL = "https://www.mp3quran.net/eng"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Stats
stats = {
    "total_sheikhs": 0,
    "successful_downloads": 0,
    "skipped_downloads": 0,
    "failed_downloads": 0,
    "missing_surahs": 0
}

# Details of failures and missing surahs for final report
failed_details = []
missing_details = []

def clean_filename(name):
    # Strip spaces and replace internal spaces/hyphens with underscores
    name = name.strip()
    name = re.sub(r'[\s\-]+', '_', name)
    # Remove any character that is not alphanumeric or underscore
    name = re.sub(r'[^\w_]', '', name)
    return name

def download_file(url, filepath):
    try:
        print(f"    Downloading {url}...")
        response = requests.get(url, headers=HEADERS, stream=True, timeout=30)
        response.raise_for_status()
        
        # Write file chunk by chunk
        temp_filepath = filepath + ".tmp"
        with open(temp_filepath, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        # Rename temp file to final filepath once download is fully complete
        os.replace(temp_filepath, filepath)
        print(f"    Saved: {os.path.basename(filepath)}")
        return True
    except Exception as e:
        print(f"    Error downloading {url}: {e}")
        if os.path.exists(filepath + ".tmp"):
            os.remove(filepath + ".tmp")
        return False

def process_sheikh(sheikh_name, profile_url):
    print(f"\nProcessing Sheikh: '{sheikh_name}' ({profile_url})")
    
    # 1. Fetch sheikh profile page
    try:
        res = requests.get(profile_url, headers=HEADERS, timeout=15)
        res.raise_for_status()
    except Exception as e:
        print(f"  Error fetching profile page: {e}")
        stats["failed_downloads"] += 2  # Count both surahs as failed
        failed_details.append(f"{sheikh_name} (Failed to fetch profile: {e})")
        return

    soup = BeautifulSoup(res.text, "html.parser")
    
    # Clean sheikh name for filename
    safe_sheikh_name = clean_filename(sheikh_name)
    
    # Surahs to download: 67 (Al-Mulk) and 91 (Ash-Shams)
    surahs_to_check = [
        {"id_prefix": "sora-067-", "name": "Al_Mulk"},
        {"id_prefix": "sora-091-", "name": "Ash_Shams"}
    ]
    
    for surah in surahs_to_check:
        surah_key = surah["name"]
        prefix = surah["id_prefix"]
        
        # Locate the card-sora div for this Surah
        card_div = soup.find(id=lambda x: x and x.startswith(prefix))
        
        if not card_div:
            print(f"  Surah {surah_key} NOT found for {sheikh_name}")
            stats["missing_surahs"] += 1
            missing_details.append(f"{sheikh_name} - {surah_key}")
            continue
            
        # Locate download button
        download_btn = card_div.find("a", class_=lambda x: x and "download-btn" in x)
        if not download_btn or not download_btn.get("href"):
            print(f"  Download button NOT found for Surah {surah_key} of {sheikh_name}")
            stats["missing_surahs"] += 1
            missing_details.append(f"{sheikh_name} - {surah_key} (No download link)")
            continue
            
        download_url = download_btn.get("href").strip()
        filename = f"{safe_sheikh_name}_{surah_key}.mp3"
        filepath = os.path.join(TARGET_DIR, filename)
        
        # Check if already downloaded
        if os.path.exists(filepath):
            print(f"  File already exists, skipping: {filename}")
            stats["skipped_downloads"] += 1
            continue
            
        # Download the file
        success = download_file(download_url, filepath)
        if success:
            stats["successful_downloads"] += 1
        else:
            stats["failed_downloads"] += 1
            failed_details.append(f"{sheikh_name} - {surah_key} (Download failed: {download_url})")

def main():
    print("Fetching list of sheikhs from homepage...")
    try:
        response = requests.get(BASE_URL, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"Failed to fetch homepage: {e}")
        return
        
    soup = BeautifulSoup(response.text, "html.parser")
    cards = soup.find_all("a", class_=lambda x: x and "card-read" in x)
    
    total_found = len(cards)
    print(f"Found {total_found} sheikhs on homepage.")
    stats["total_sheikhs"] = total_found
    
    for idx, card in enumerate(cards):
        name = card.text.strip()
        href = card.get("href", "").strip()
        profile_url = urllib.parse.urljoin(BASE_URL, href)
        
        print(f"\n[{idx+1}/{total_found}] Sheikh: {name}")
        process_sheikh(name, profile_url)
        
        # Polite delay to avoid hammering the server
        time.sleep(0.5)

    # Print final summary
    report = f"""
===========================================
          FINAL EXECUTION REPORT
===========================================
Total Sheikhs Processed: {stats["total_sheikhs"]}
Successful Downloads:   {stats["successful_downloads"]}
Existing Files Skipped:  {stats["skipped_downloads"]}
Failed Downloads:        {stats["failed_downloads"]}
Missing Surahs:          {stats["missing_surahs"]}
===========================================
"""
    print(report)
    
    # Write report to file
    report_path = os.path.join(TARGET_DIR, "download_report.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)
        
        if failed_details:
            f.write("\n\nFailed Downloads Details:\n")
            for fd in failed_details:
                f.write(f"- {fd}\n")
                
        if missing_details:
            f.write("\n\nMissing Surahs Details:\n")
            for md in missing_details:
                f.write(f"- {md}\n")
                
    print(f"Report saved to: {report_path}")

if __name__ == "__main__":
    main()
