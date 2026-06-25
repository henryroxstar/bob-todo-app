from datetime import datetime
from database import db


class Todo(db.Model):
    __tablename__ = "todos"

    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    completed   = db.Column(db.Boolean, default=False, nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    def to_dict(self):
        return {
            "id":          self.id,
            "title":       self.title,
            "description": self.description,
            "completed":   self.completed,
            "created_at":  self.created_at.isoformat() + "Z",
            "updated_at":  self.updated_at.isoformat() + "Z",
        }
