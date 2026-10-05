import os
from pathlib import Path
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore, storage
from app.config.settings import settings

class FirebaseService:
    def __init__(self):
        self._app = None
        self._db = None
        self._bucket = None
        self._initialize()

    def _initialize(self):
        try:
            if not firebase_admin._apps:
                key_path = settings.FIREBASE_KEY_PATH
                if not os.path.exists(key_path):
                    # Try relative to current working dir
                    key_path = "firebase-key.json"
                
                if os.path.exists(key_path):
                    cred = credentials.Certificate(key_path)
                    self._app = firebase_admin.initialize_app(
                        cred,
                        {"storageBucket": settings.FIREBASE_STORAGE_BUCKET}
                    )
                else:
                    self._app = firebase_admin.initialize_app(
                        options={
                            "projectId": settings.FIREBASE_PROJECT_ID,
                            "storageBucket": settings.FIREBASE_STORAGE_BUCKET
                        }
                    )
            else:
                self._app = firebase_admin.get_app()
            
            self._db = firestore.client()
            self._bucket = storage.bucket()
            print("Successfully initialized Firebase Admin (Firestore + Storage)")
        except Exception as e:
            print(f"Firebase initialization warning: {e}")

    @property
    def db(self):
        if self._db is None:
            self._initialize()
        return self._db

    @property
    def bucket(self):
        if self._bucket is None:
            self._initialize()
        return self._bucket

    def upload_bytes(self, destination_blob_name: str, data: bytes, content_type: Optional[str] = None) -> str:
        """Uploads bytes directly to Firebase Storage bucket."""
        blob = self.bucket.blob(destination_blob_name)
        if content_type:
            blob.content_type = content_type
        blob.upload_from_string(data, content_type=content_type)
        return destination_blob_name

    def download_bytes(self, source_blob_name: str) -> bytes:
        """Downloads bytes from Firebase Storage."""
        blob = self.bucket.blob(source_blob_name)
        return blob.download_as_bytes()

    def upload_file(self, local_file_path: Path, destination_blob_name: str, content_type: Optional[str] = None) -> str:
        """Uploads a local file to Firebase Storage."""
        blob = self.bucket.blob(destination_blob_name)
        if content_type:
            blob.content_type = content_type
        blob.upload_from_filename(str(local_file_path), content_type=content_type)
        return destination_blob_name

    def download_to_file(self, source_blob_name: str, local_destination_path: Path):
        """Downloads a blob to a local file."""
        local_destination_path.parent.mkdir(parents=True, exist_ok=True)
        blob = self.bucket.blob(source_blob_name)
        blob.download_to_filename(str(local_destination_path))

    def delete_file(self, blob_name: str):
        """Deletes a file from Firebase Storage."""
        try:
            blob = self.bucket.blob(blob_name)
            if blob.exists():
                blob.delete()
        except Exception as e:
            print(f"Error deleting blob {blob_name}: {e}")

    def file_exists(self, blob_name: str) -> bool:
        """Checks if a file exists in Firebase Storage."""
        blob = self.bucket.blob(blob_name)
        return blob.exists()

firebase_service = FirebaseService()
