
from flask import Flask, request, jsonify, send_from_directory, session
import pandas as pd
import joblib
import sqlite3
import os

from werkzeug.security import generate_password_hash, check_password_hash
from chatbot import get_chatbot_response


# ==========================================
# 1. FLASK APPLICATION
# ==========================================

app = Flask(__name__, static_folder=".", static_url_path="")

app.secret_key = os.environ.get(
    "SECRET_KEY",
    "change-this-secret-key-for-local-development"
)

model = joblib.load("house_price_model.pkl")


# ==========================================
# 2. DATABASE CONNECTION
# ==========================================

def get_db_connection():

    connection = sqlite3.connect("users.db")
    connection.row_factory = sqlite3.Row

    return connection


# ==========================================
# 3. CREATE USERS TABLE
# ==========================================

def create_users_table():

    connection = get_db_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    connection.commit()
    connection.close()


create_users_table()


# ==========================================
# 4. FRONT PAGE
# ==========================================

@app.route("/")
def home():

    return send_from_directory(".", "welcome.html")


# ==========================================
# 5. LOGIN PAGE
# ==========================================

@app.route("/login-page")
def login_page():

    return send_from_directory(".", "login.html")


# ==========================================
# 6. SIGNUP PAGE
# ==========================================

@app.route("/signup-page")
def signup_page():

    return send_from_directory(".", "signup.html")


# ==========================================
# 7. DASHBOARD
# ==========================================

@app.route("/home")
def dashboard():

    if "user_id" not in session:

        return send_from_directory(".", "welcome.html")

    return send_from_directory(".", "index.html")


# ==========================================
# 8. USER SIGNUP
# ==========================================

@app.route("/signup", methods=["POST"])
def signup():

    try:

        details = request.get_json()

        if not details:
            return jsonify({
                "error": "Invalid request."
            }), 400

        username = details.get("username", "").strip()
        email = details.get("email", "").strip().lower()
        password = details.get("password", "")

        if not username or not email or not password:

            return jsonify({
                "error": "Please fill in all fields."
            }), 400

        if len(password) < 8:

            return jsonify({
                "error": "Password must contain at least 8 characters."
            }), 400

        hashed_password = generate_password_hash(password)

        connection = get_db_connection()

        connection.execute("""
            INSERT INTO users (username, email, password)
            VALUES (?, ?, ?)
        """, (username, email, hashed_password))

        connection.commit()
        connection.close()

        return jsonify({
            "message": "Account created successfully!"
        }), 201

    except sqlite3.IntegrityError:

        return jsonify({
            "error": "This email is already registered."
        }), 409

    except Exception:

        app.logger.exception("Signup failed")

        return jsonify({
            "error": "Signup could not be completed."
        }), 500


# ==========================================
# 9. USER LOGIN
# ==========================================

@app.route("/login", methods=["POST"])
def login():

    try:

        details = request.get_json()

        if not details:

            return jsonify({
                "error": "Invalid request."
            }), 400

        email = details.get("email", "").strip().lower()
        password = details.get("password", "")

        if not email or not password:

            return jsonify({
                "error": "Please enter email and password."
            }), 400

        connection = get_db_connection()

        user = connection.execute("""
            SELECT * FROM users WHERE email = ?
        """, (email,)).fetchone()

        connection.close()

        if user and check_password_hash(user["password"], password):

            session.clear()

            session["user_id"] = user["id"]
            session["username"] = user["username"]

            return jsonify({
                "message": "Login successful!",
                "username": user["username"]
            })

        return jsonify({
            "error": "Invalid email or password."
        }), 401

    except Exception:

        app.logger.exception("Login failed")

        return jsonify({
            "error": "Login could not be completed."
        }), 500


# ==========================================
# 10. CHECK LOGIN STATUS
# ==========================================

@app.route("/auth-status")
def auth_status():

    if "user_id" in session:

        return jsonify({
            "logged_in": True,
            "username": session["username"]
        })

    return jsonify({
        "logged_in": False
    })


# ==========================================
# 11. USER LOGOUT
# ==========================================

@app.route("/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "message": "Logged out successfully!"
    })


# ==========================================
# 12. HOUSE PRICE PREDICTION
# ==========================================

@app.route("/predict", methods=["POST"])
def predict():

    if "user_id" not in session:

        return jsonify({
            "error": "Please login first to predict house prices."
        }), 401

    try:

        details = request.get_json()

        if not details:

            return jsonify({
                "error": "Please provide house details."
            }), 400

        house = pd.DataFrame([{
            "city": details["city"].strip().lower(),
            "locality": details["locality"].strip().lower(),
            "area_sqft": float(details["area"]),
            "bhk": int(details["bedrooms"]),
            "bath": int(details["bathrooms"]),
            "floor": int(details["floor"]),
            "age_years": int(details["age"])
        }])

        if (
            house["area_sqft"].iloc[0] <= 0
            or house["bhk"].iloc[0] <= 0
            or house["bath"].iloc[0] <= 0
            or house["floor"].iloc[0] < 0
            or house["age_years"].iloc[0] < 0
        ):

            return jsonify({
                "error": "Please enter valid positive house details."
            }), 400

        prediction = model.predict(house)[0]

        return jsonify({
            "predicted_price_lakhs": round(float(prediction), 2)
        })

    except (KeyError, TypeError, ValueError):

        return jsonify({
            "error": "Please enter valid house details."
        }), 400

    except Exception:

        app.logger.exception("Prediction failed")

        return jsonify({
            "error": "Prediction could not be completed."
        }), 500


# ==========================================
# 13. WEBSITE AI CHATBOT
# ==========================================

@app.route("/chatbot", methods=["POST"])
def chatbot():

    try:

        details = request.get_json()

        if not details:

            return jsonify({
                "error": "Please enter a question."
            }), 400

        question = details.get("message", "")

        if not isinstance(question, str) or not question.strip():

            return jsonify({
                "error": "Please enter a valid question."
            }), 400

        if len(question) > 1000:

            return jsonify({
                "error": "Your question is too long."
            }), 400

        answer = get_chatbot_response(question)

        return jsonify({
            "reply": answer
        })

    except Exception:

        app.logger.exception("Chatbot failed")

        return jsonify({
            "error": "Sorry, something went wrong."
        }), 500


# ==========================================
# 14. RUN APPLICATION
# ==========================================

if __name__ == "__main__":

    create_users_table()

    app.run(
        host="0.0.0.0",
        debug=False,
        port=5000
    )
