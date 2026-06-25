import pytest
import sys
import os

# Ensure backend/ is on the path so imports like `from app import app` work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import app as app_module
from database import db as _db


@pytest.fixture(scope="session")
def application():
    """Configure the Flask app for testing with an in-memory SQLite DB."""
    app_module.app.config["TESTING"] = True
    app_module.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app_module.app.config["SECRET_KEY"] = "test-secret"
    with app_module.app.app_context():
        _db.create_all()
        yield app_module.app
        _db.drop_all()


@pytest.fixture(scope="function")
def client(application):
    """A test client that rolls back DB state after each test."""
    with application.test_client() as c:
        yield c
    # Wipe all todos between tests so they don't bleed
    with application.app_context():
        _db.session.query(app_module.Todo).delete()
        _db.session.commit()
