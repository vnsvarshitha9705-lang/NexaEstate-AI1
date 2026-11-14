
import re


# ==========================================
# 1. WEBSITE KNOWLEDGE BASE
# ==========================================

KNOWLEDGE_BASE = {

    "website": {
        "keywords": [
            "website", "project", "home price",
            "house price estimator", "purpose",
            "about website", "what is this"
        ],
        "answer": (
            "Welcome to Home Price Estimator! "
            "This website helps users estimate house prices "
            "using machine learning. You can create an account, "
            "log in, enter house details, and receive an estimated price."
        )
    },

    "prediction": {
        "keywords": [
            "predict", "prediction", "estimate",
            "calculate price", "house value",
            "price prediction", "predict price"
        ],
        "answer": (
            "To predict a house price, log in to your account, "
            "open the prediction page, enter the required house "
            "details, and click the Predict button. "
            "The machine learning model will calculate an estimated price."
        )
    },

    "house_details": {
        "keywords": [
            "details", "information", "requirements",
            "area", "bedrooms", "bathrooms", "floor",
            "age", "city", "locality", "square feet",
            "sqft", "bhk"
        ],
        "answer": (
            "The house prediction form requires seven details: "
            "City, Locality, Area in square feet, Number of Bedrooms, "
            "Number of Bathrooms, Floor Number, and House Age in years."
        )
    },

    "login": {
        "keywords": [
            "login", "log in", "sign in",
            "account login", "password"
        ],
        "answer": (
            "To log in, open the Login page and enter your registered "
            "email address and password. After successful login, "
            "you can access the main house prediction dashboard."
        )
    },

    "signup": {
        "keywords": [
            "signup", "sign up", "register",
            "registration", "create account",
            "new account"
        ],
        "answer": (
            "To create an account, open the Sign Up page and enter "
            "your username, email address, and password. "
            "Your password must contain at least 8 characters."
        )
    },

    "logout": {
        "keywords": [
            "logout", "log out", "sign out"
        ],
        "answer": (
            "To log out, use the Logout option on the website. "
            "Your current login session will be cleared."
        )
    },

    "machine_learning": {
        "keywords": [
            "machine learning", "ml model",
            "algorithm", "model", "technology",
            "how does it work"
        ],
        "answer": (
            "This website uses a trained machine learning model "
            "to estimate house prices based on the details entered "
            "in the prediction form."
        )
    },

    "price_result": {
        "keywords": [
            "result", "predicted price", "estimated price",
            "price output", "lakhs", "prediction output"
        ],
        "answer": (
            "After submitting valid house details, the website "
            "displays the estimated house price in lakhs."
        )
    }
}


# ==========================================
# 2. WEBSITE TOPIC KEYWORDS
# ==========================================

WEBSITE_TOPICS = {
    word
    for item in KNOWLEDGE_BASE.values()
    for keyword in item["keywords"]
    for word in keyword.split()
}


# ==========================================
# 3. TEXT CLEANING
# ==========================================

def clean_text(text):

    text = text.lower()

    text = re.sub(r"[^a-z0-9\s]", " ", text)

    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ==========================================
# 4. CHATBOT RESPONSE ENGINE
# ==========================================

def get_chatbot_response(question):

    if not isinstance(question, str) or not question.strip():
        return "Please enter a question."

    question = clean_text(question)

    # Greeting responses

    greetings = ["hi", "hello", "hey", "good morning",
                 "good afternoon", "good evening"]

    if question in greetings:
        return (
            "Hello! Welcome to Home Price Estimator. "
            "I can help you understand this website and its features. "
            "What would you like to know?"
        )

    # Find the best matching website topic

    best_score = 0
    best_answer = None

    question_words = set(question.split())

    for item in KNOWLEDGE_BASE.values():

        score = 0

        for keyword in item["keywords"]:

            keyword = clean_text(keyword)

            if keyword in question:
                score += len(keyword.split()) + 2

            elif set(keyword.split()).issubset(question_words):
                score += len(keyword.split()) + 1

        if score > best_score:
            best_score = score
            best_answer = item["answer"]

    # Return the best matching answer

    if best_answer and best_score >= 3:
        return best_answer

    # Allow unknown questions that mention website topics

    if question_words.intersection(WEBSITE_TOPICS):
        return (
            "I can help with Home Price Estimator, but I don't "
            "have enough information to answer that particular question. "
            "Please ask about registration, login, house details, "
            "or price prediction."
        )

    # Reject unrelated questions

    return (
        "Sorry! I am the Home Price Estimator Assistant. "
        "I can only answer questions related to this website, "
        "its features, login, registration, and house price prediction."
    )
