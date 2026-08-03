import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    # Security Keys
    SECRET_KEY = os.getenv('SECRET_KEY', 'super-secret-key-insurance-001')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-insurance-001')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # ✅ SQLite Database Configuration (Local file-based, PostgreSQL removed)
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'insurance.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Document / File Upload Configuration
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB Max File Size
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'}