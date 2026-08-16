"""
Comprehensive automated test suite for the Itqān unified backend.
Tests Database, Auth, Progress, Courses, Qaida, Makhaarij, and Qari APIs.
"""

import sys
from fastapi.testclient import TestClient

# Prevent UnicodeEncodeError on Windows terminals
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="backslashreplace")
    except (AttributeError, OSError):
        pass

from app.main import app
from app.core.database import init_db

# Initialize database
init_db()

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("🚀 RUNNING ITQĀN UNIFIED BACKEND TEST SUITE")
    print("==================================================")

    # 1. Health Check
    print("\n[1] Testing GET /health...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print("   -> Status:", health_data.get("status"))
    print("   -> API Version:", health_data.get("api_version"))
    print("   -> Database:", health_data.get("database"))

    # 2. User Registration
    print("\n[2] Testing POST /api/v1/auth/register...")
    test_user = {
        "email": "test_student@itqan.app",
        "username": "test_student",
        "full_name": "Zayd ibn Thabit",
        "password": "Password123!",
        "reference_qari_name": "Mahmoud Khalil Al-Husary"
    }
    # Clean up user if already exists from previous test
    reg_res = client.post("/api/v1/auth/register", json=test_user)
    if reg_res.status_code == 400:
        print("   -> User exists, logging in instead...")
        login_res = client.post("/api/v1/auth/login", json={
            "username_or_email": test_user["email"],
            "password": test_user["password"]
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        auth_data = login_res.json()
    else:
        assert reg_res.status_code == 200, f"Register failed: {reg_res.text}"
        auth_data = reg_res.json()

    token = auth_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   -> Registered/Logged In User ID:", auth_data["user_id"])
    print("   -> JWT Token generated successfully")

    # 3. User Profile
    print("\n[3] Testing GET /api/v1/auth/me...")
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200, f"Get /me failed: {me_res.text}"
    user_info = me_res.json()
    print("   -> Name:", user_info["full_name"])
    print("   -> Reference Qari:", user_info["reference_qari_name"])
    print("   -> Current Streak:", user_info["streak_days"], "days")

    # 4. User Progress Update
    print("\n[4] Testing POST /api/v1/users/me/progress...")
    progress_payload = {
        "course_id": "tajweed",
        "lesson_id": "6.1",
        "status": "completed",
        "score": 95,
        "minutes_spent": 10,
        "ayahs_recited": 3
    }
    prg_res = client.post("/api/v1/users/me/progress", json=progress_payload, headers=headers)
    assert prg_res.status_code == 200, f"Update progress failed: {prg_res.text}"
    prg_data = prg_res.json()
    print("   -> Updated lesson:", prg_data["lesson_id"])
    print("   -> Score:", prg_data["score"])
    print("   -> Mastery level:", prg_data["mastery_level"])

    # 5. User Progress Overview & Stats
    print("\n[5] Testing GET /api/v1/users/me/progress...")
    stats_res = client.get("/api/v1/users/me/progress", headers=headers)
    assert stats_res.status_code == 200, f"Get stats failed: {stats_res.text}"
    stats_data = stats_res.json()
    print("   -> Total XP:", stats_data["total_xp"])
    print("   -> Tajweed Mastery %:", stats_data["tajweed_mastery_percentage"], "%")
    print("   -> Total Recorded Lessons:", len(stats_data["progress_items"]))

    # 6. Courses & Syllabus
    print("\n[6] Testing GET /api/v1/courses and modules...")
    courses_res = client.get("/api/v1/courses")
    assert courses_res.status_code == 200
    print("   -> Courses count:", len(courses_res.json()["courses"]))

    modules_res = client.get("/api/v1/courses/tajweed/modules")
    assert modules_res.status_code == 200
    modules = modules_res.json()["modules"]
    print("   -> Tajweed Modules count:", len(modules))

    rule_res = client.get("/api/v1/courses/tajweed/rules/6.1")
    assert rule_res.status_code == 200
    rule_info = rule_res.json()
    print("   -> Rule 6.1 fetched:", rule_info["name"], f"({rule_info['arabic_name']})")
    print("   -> Benchmark Ayah:", rule_info["target_ayah"]["text_uthmani"])

    # 7. Qaida Lessons
    print("\n[7] Testing GET /api/v1/qaida/lessons...")
    qaida_res = client.get("/api/v1/qaida/lessons")
    assert qaida_res.status_code == 200
    qaida_lessons = qaida_res.json()["lessons"]
    print("   -> Qaida Lessons count:", len(qaida_lessons))

    lesson1_res = client.get("/api/v1/qaida/lessons/lesson_01")
    assert lesson1_res.status_code == 200
    l1 = lesson1_res.json()
    print("   -> Lesson 1:", l1["title"])
    items_sample = l1.get("items", [])[:5]
    print("   -> First 5 letters:", " ".join(items_sample))

    # 8. Makhaarij Explorer Data
    print("\n[8] Testing GET /api/v1/makharij...")
    mak_res = client.get("/api/v1/makharij")
    assert mak_res.status_code == 200
    makharij_areas = mak_res.json()["areas"]
    print("   -> Primary Vocal Areas count:", len(makharij_areas))

    # 9. Qari Directory Search
    print("\n[9] Testing GET /api/v1/qaris?query=khalil...")
    qari_res = client.get("/api/v1/qaris", params={"query": "khalil"})
    assert qari_res.status_code == 200
    qaris_found = qari_res.json()["qaris"]
    print("   -> Matches for 'khalil':", len(qaris_found))
    if qaris_found:
        print("   -> Qari:", qaris_found[0]["name"], f"({qaris_found[0]['arabic_name']})")
        print("   -> Style:", qaris_found[0]["style"])

    print("\n==================================================")
    print("🎉 ALL 9 BACKEND TEST SUITES PASSED FLAWLESSLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
