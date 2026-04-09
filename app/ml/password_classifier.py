import re
import math
import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "rf_model.pkl")

LABEL_MAP = {0: "weak", 1: "medium", 2: "strong"}

SUGGESTIONS = {
    "weak": (
        "Your password is weak. Add uppercase letters, numbers, and special "
        "characters (e.g. @, #, $). Aim for at least 10 characters."
    ),
    "medium": (
        "Your password is moderate. Try making it longer (12+ characters) and "
        "mixing more special characters to make it stronger."
    ),
    "strong": (
        "Great password! It is strong and hard to guess. Remember to use a "
        "unique password for every account."
    ),
}

_model = None


# ─── Feature extraction (matches your friend's notebook exactly) ──────────────

def extract_features(password: str) -> np.ndarray:
    length = len(password)
    upper = sum(1 for c in password if c.isupper())
    lower = sum(1 for c in password if c.islower())
    digits = sum(1 for c in password if c.isdigit())
    special = len(re.findall(r'[^a-zA-Z0-9]', password))
    unique_chars = len(set(password))

    # Entropy
    prob = [password.count(c) / length for c in set(password)]
    entropy = -sum([p * math.log2(p) for p in prob]) if length > 0 else 0

    # Sequence detection
    sequences = ["123", "234", "345", "abc", "bcd", "cde"]
    has_sequence = int(any(seq in password.lower() for seq in sequences))

    # Common patterns
    common_patterns = [
        "password", "admin", "qwerty", "letmein",
        "welcome", "1234", "12345", "abc123", "iloveyou"
    ]
    common_pattern = int(any(p in password.lower() for p in common_patterns))

    return np.array([
        length, upper, lower, digits, special,
        unique_chars, entropy, has_sequence, common_pattern
    ], dtype=float)


def load_model():
    global _model
    if _model is not None:
        return _model
    if os.path.exists(MODEL_PATH):
        _model = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded from {MODEL_PATH}")
    else:
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Please place rf_model.pkl in app/ml/model/")
    return _model


def classify_password(password: str) -> dict:
    model = load_model()
    features = extract_features(password).reshape(1, -1)
    label_index = int(model.predict(features)[0])
    strength = LABEL_MAP[label_index]
    return {
        "strength": strength,
        "suggestion": SUGGESTIONS[strength],
    }