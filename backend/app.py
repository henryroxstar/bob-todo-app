import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import Todo
from database import db, init_db

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", "sqlite:///todos.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")
CORS(app)

init_db(app)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_or_404(todo_id):
    todo = db.session.get(Todo, todo_id)
    if todo is None:
        return None, (jsonify({"error": "todo not found"}), 404)
    return todo, None


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/api/todos", methods=["GET"])
def get_todos():
    todos = Todo.query.order_by(Todo.created_at.desc()).all()
    return jsonify([todo.to_dict() for todo in todos]), 200


@app.route("/api/todos", methods=["POST"])
def create_todo():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required"}), 400
    todo = Todo(
        title=title,
        description=(data.get("description") or "").strip() or None,
        completed=False,
    )
    db.session.add(todo)
    db.session.commit()
    return jsonify(todo.to_dict()), 201


@app.route("/api/todos/<int:todo_id>", methods=["PUT"])
def update_todo(todo_id):
    todo, err = _get_or_404(todo_id)
    if err:
        return err
    data = request.get_json(silent=True) or {}
    if "title" in data:
        title = (data["title"] or "").strip()
        if not title:
            return jsonify({"error": "title cannot be empty"}), 400
        todo.title = title
    if "description" in data:
        todo.description = (data["description"] or "").strip() or None
    if "completed" in data:
        todo.completed = bool(data["completed"])
    db.session.commit()
    return jsonify(todo.to_dict()), 200


@app.route("/api/todos/<int:todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    todo, err = _get_or_404(todo_id)
    if err:
        return err
    db.session.delete(todo)
    db.session.commit()
    return "", 204


@app.route("/api/todos/<int:todo_id>/toggle", methods=["PATCH"])
def toggle_todo(todo_id):
    todo, err = _get_or_404(todo_id)
    if err:
        return err
    todo.completed = not todo.completed
    db.session.commit()
    return jsonify(todo.to_dict()), 200


if __name__ == "__main__":
    app.run(debug=True)
