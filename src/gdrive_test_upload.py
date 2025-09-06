import os, io, json
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root of backend
load_dotenv(Path(__file__).resolve().parent.parent / '.env')

ENABLED = os.getenv('GDRIVE_ENABLED') == '1'
FOLDER_ID = os.getenv('GDRIVE_FOLDER_ID')
CREDS_JSON = os.getenv('GDRIVE_SERVICE_ACCOUNT_JSON')
CREDS_FILE = os.getenv('GDRIVE_SERVICE_ACCOUNT_FILE')

print('GDRIVE_ENABLED =', ENABLED)
print('GDRIVE_FOLDER_ID =', (FOLDER_ID[:6] + '...' if FOLDER_ID else None))
print('SERVICE JSON present =', bool(CREDS_JSON))
print('SERVICE FILE path =', CREDS_FILE, 'exists =', bool(CREDS_FILE and os.path.exists(CREDS_FILE)))

if not ENABLED or not FOLDER_ID or not (CREDS_JSON or (CREDS_FILE and os.path.exists(CREDS_FILE))):
    raise SystemExit('Google Drive not configured via .env')

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

creds_info = None
creds_file = os.getenv('GDRIVE_SERVICE_ACCOUNT_FILE')
if creds_file and os.path.exists(creds_file):
    with open(creds_file, 'r', encoding='utf-8') as cf:
        creds_info = json.load(cf)
else:
    creds_info = json.loads(CREDS_JSON)
    if isinstance(creds_info, dict) and 'private_key' in creds_info:
        creds_info['private_key'] = creds_info['private_key'].replace('\\n', '\n')

creds = service_account.Credentials.from_service_account_info(
    creds_info, scopes=['https://www.googleapis.com/auth/drive.file']
)
service = build('drive', 'v3', credentials=creds)

# Inspect folder
try:
    folder_info = service.files().get(fileId=FOLDER_ID, fields='id, name, driveId, mimeType, owners, permissions', supportsAllDrives=True).execute()
    print('Folder name:', folder_info.get('name'))
    print('Shared Drive ID (driveId):', folder_info.get('driveId'))
    print('MimeType:', folder_info.get('mimeType'))
except Exception as e:
    print('Failed to access folder:', e)
    raise

# Pick a local test file
test_path = Path(__file__).resolve().parent / 'static' / 'receipts' / 'test-receipt.jpg'
if not test_path.exists():
    raise SystemExit(f'Test file not found: {test_path}')

with open(test_path, 'rb') as f:
    media = MediaIoBaseUpload(f, mimetype='image/jpeg', resumable=False)
    meta = { 'name': 'test-receipt.jpg', 'parents': [FOLDER_ID] }
    created = service.files().create(
        body=meta,
        media_body=media,
        fields='id, webViewLink, webContentLink',
        supportsAllDrives=True
    ).execute()
    print('Uploaded file ID:', created.get('id'))
    print('webViewLink:', created.get('webViewLink'))
    print('webContentLink:', created.get('webContentLink'))