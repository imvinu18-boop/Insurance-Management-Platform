# backend/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_migrate import Migrate
from flask_marshmallow import Marshmallow

# Initialize extensions without passing app instance yet (Application Factory Pattern)
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
cors = CORS()
migrate = Migrate()
ma = Marshmallow()