"""
Unit tests for every API endpoint in app.py.
Coverage targets: GET /api/todos, POST /api/todos,
                  PUT /api/todos/<id>, DELETE /api/todos/<id>,
                  PATCH /api/todos/<id>/toggle
"""
import json
import pytest


# ── Helpers ────────────────────────────────────────────────────────────────────

def _create(client, title="Buy milk", description=""):
    """POST a todo and return the parsed JSON body."""
    resp = client.post(
        "/api/todos",
        data=json.dumps({"title": title, "description": description}),
        content_type="application/json",
    )
    return resp, resp.get_json()


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/todos
# ══════════════════════════════════════════════════════════════════════════════

class TestGetTodos:
    def test_returns_empty_list_when_no_todos(self, client):
        resp = client.get("/api/todos")
        assert resp.status_code == 200
        assert resp.get_json() == []

    def test_returns_all_todos(self, client):
        _create(client, "Task A")
        _create(client, "Task B")
        resp = client.get("/api/todos")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == 2

    def test_todos_ordered_newest_first(self, client):
        _create(client, "First")
        _create(client, "Second")
        data = client.get("/api/todos").get_json()
        # Most recently created should be first
        assert data[0]["title"] == "Second"
        assert data[1]["title"] == "First"

    def test_todo_shape(self, client):
        _create(client, "Shape test", "some desc")
        item = client.get("/api/todos").get_json()[0]
        for key in ("id", "title", "description", "completed", "created_at", "updated_at"):
            assert key in item, f"missing key: {key}"
        assert item["completed"] is False


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/todos
# ══════════════════════════════════════════════════════════════════════════════

class TestCreateTodo:
    def test_creates_todo_with_title_and_description(self, client):
        resp, data = _create(client, "Buy milk", "Whole milk")
        assert resp.status_code == 201
        assert data["title"] == "Buy milk"
        assert data["description"] == "Whole milk"
        assert data["completed"] is False
        assert data["id"] is not None

    def test_creates_todo_without_description(self, client):
        resp, data = _create(client, "No desc")
        assert resp.status_code == 201
        assert data["description"] is None

    def test_strips_whitespace_from_title(self, client):
        resp, data = _create(client, "  Trim me  ")
        assert resp.status_code == 201
        assert data["title"] == "Trim me"

    def test_returns_400_when_title_missing(self, client):
        resp = client.post(
            "/api/todos",
            data=json.dumps({"description": "no title"}),
            content_type="application/json",
        )
        assert resp.status_code == 400
        assert "error" in resp.get_json()

    def test_returns_400_when_title_empty_string(self, client):
        resp, data = _create(client, "   ")
        assert resp.status_code == 400
        assert "error" in data

    def test_returns_400_when_body_is_missing(self, client):
        resp = client.post("/api/todos", content_type="application/json")
        assert resp.status_code == 400

    def test_returns_400_when_body_is_not_json(self, client):
        resp = client.post("/api/todos", data="not json", content_type="text/plain")
        assert resp.status_code == 400

    def test_timestamps_present_in_response(self, client):
        _, data = _create(client, "Timestamp check")
        assert data["created_at"].endswith("Z")
        assert data["updated_at"].endswith("Z")


# ══════════════════════════════════════════════════════════════════════════════
# PUT /api/todos/<id>
# ══════════════════════════════════════════════════════════════════════════════

class TestUpdateTodo:
    def test_updates_title(self, client):
        _, created = _create(client, "Old title")
        resp = client.put(
            f"/api/todos/{created['id']}",
            data=json.dumps({"title": "New title"}),
            content_type="application/json",
        )
        assert resp.status_code == 200
        assert resp.get_json()["title"] == "New title"

    def test_updates_description(self, client):
        _, created = _create(client, "Todo")
        resp = client.put(
            f"/api/todos/{created['id']}",
            data=json.dumps({"description": "Updated desc"}),
            content_type="application/json",
        )
        assert resp.status_code == 200
        assert resp.get_json()["description"] == "Updated desc"

    def test_updates_completed_flag(self, client):
        _, created = _create(client, "Complete me")
        resp = client.put(
            f"/api/todos/{created['id']}",
            data=json.dumps({"completed": True}),
            content_type="application/json",
        )
        assert resp.status_code == 200
        assert resp.get_json()["completed"] is True

    def test_partial_update_preserves_other_fields(self, client):
        _, created = _create(client, "Original", "Keep this")
        resp = client.put(
            f"/api/todos/{created['id']}",
            data=json.dumps({"title": "Changed"}),
            content_type="application/json",
        )
        data = resp.get_json()
        assert data["title"] == "Changed"
        assert data["description"] == "Keep this"

    def test_returns_400_when_title_set_to_empty(self, client):
        _, created = _create(client, "Has title")
        resp = client.put(
            f"/api/todos/{created['id']}",
            data=json.dumps({"title": ""}),
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_returns_404_for_missing_todo(self, client):
        resp = client.put(
            "/api/todos/9999",
            data=json.dumps({"title": "Ghost"}),
            content_type="application/json",
        )
        assert resp.status_code == 404
        assert "error" in resp.get_json()

    def test_no_body_returns_200_unchanged(self, client):
        _, created = _create(client, "Unchanged")
        resp = client.put(
            f"/api/todos/{created['id']}",
            data=json.dumps({}),
            content_type="application/json",
        )
        assert resp.status_code == 200
        assert resp.get_json()["title"] == "Unchanged"


# ══════════════════════════════════════════════════════════════════════════════
# DELETE /api/todos/<id>
# ══════════════════════════════════════════════════════════════════════════════

class TestDeleteTodo:
    def test_deletes_existing_todo(self, client):
        _, created = _create(client, "Delete me")
        resp = client.delete(f"/api/todos/{created['id']}")
        assert resp.status_code == 204
        assert resp.data == b""

    def test_todo_no_longer_listed_after_delete(self, client):
        _, created = _create(client, "Gone")
        client.delete(f"/api/todos/{created['id']}")
        todos = client.get("/api/todos").get_json()
        ids = [t["id"] for t in todos]
        assert created["id"] not in ids

    def test_returns_404_for_missing_todo(self, client):
        resp = client.delete("/api/todos/9999")
        assert resp.status_code == 404
        assert "error" in resp.get_json()


# ══════════════════════════════════════════════════════════════════════════════
# PATCH /api/todos/<id>/toggle
# ══════════════════════════════════════════════════════════════════════════════

class TestToggleTodo:
    def test_toggles_false_to_true(self, client):
        _, created = _create(client, "Toggle me")
        assert created["completed"] is False
        resp = client.patch(f"/api/todos/{created['id']}/toggle")
        assert resp.status_code == 200
        assert resp.get_json()["completed"] is True

    def test_toggles_true_to_false(self, client):
        _, created = _create(client, "Toggle back")
        tid = created["id"]
        client.patch(f"/api/todos/{tid}/toggle")  # → True
        resp = client.patch(f"/api/todos/{tid}/toggle")  # → False
        assert resp.status_code == 200
        assert resp.get_json()["completed"] is False

    def test_returns_full_todo_in_response(self, client):
        _, created = _create(client, "Full response")
        data = client.patch(f"/api/todos/{created['id']}/toggle").get_json()
        for key in ("id", "title", "description", "completed", "created_at", "updated_at"):
            assert key in data

    def test_returns_404_for_missing_todo(self, client):
        resp = client.patch("/api/todos/9999/toggle")
        assert resp.status_code == 404
        assert "error" in resp.get_json()
