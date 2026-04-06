"""
LETESE● Load Tests — Locust
Run: locust -f backend/tests/load_test.py --host=https://api.letese.xyz
"""
from locust import HttpUser, task, between

class LETESEUser(HttpUser):
    wait_time = between(1, 3)
    token = None

    def on_start(self):
        # Login
        resp = self.client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "otp": "123456",
        })
        if resp.status_code == 200:
            self.token = resp.json()["access_token"]

    @task(3)
    def list_cases(self):
        self.client.get("/api/v1/cases",
            headers={"Authorization": f"Bearer {self.token}"})

    @task(2)
    def get_inbox(self):
        self.client.get("/api/v1/communications/inbox",
            headers={"Authorization": f"Bearer {self.token}"})

    @task(1)
    def list_tasks(self):
        self.client.get("/api/v1/tasks",
            headers={"Authorization": f"Bearer {self.token}"})

    @task(1)
    def health_check(self):
        self.client.get("/health")

class LETESEScraper(HttpUser):
    """Simulate high scrape load."""
    wait_time = between(0.5, 1)
    token = None

    @task
    def trigger_scrape(self):
        self.client.post("/api/v1/cases/123/scrape",
            headers={"Authorization": f"Bearer {self.token}"})
