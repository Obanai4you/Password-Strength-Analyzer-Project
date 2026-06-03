import re
import math
import os
import joblib
import pandas as pd


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "model",
    "rf_model.pkl"
)

LABEL_MAP = {
    0: "weak",
    1: "medium",
    2: "strong"
}

SUGGESTIONS = {
    "weak":
        "Password is weak. Add uppercase, numbers and special characters.",

    "medium":
        "Password is medium. Increase length and combine all character types.",

    "strong":
        "Strong password. Keep using unique passwords."
}

FEATURE_NAMES = [
    "length",
    "upper",
    "lower",
    "digits",
    "special",
    "unique_chars",
    "entropy",
    "has_sequence",
    "common_pattern"
]

COMMON_PATTERNS = [
    "password",
    "admin",
    "qwerty",
    "letmein",
    "welcome",
    "1234",
    "12345",
    "abc123",
    "iloveyou"
]

_model = None


# ======================
# Feature Extraction
# ======================

def extract_features(password):

    length = len(password)

    upper = sum(
        1 for c in password
        if c.isupper()
    )

    lower = sum(
        1 for c in password
        if c.islower()
    )

    digits = sum(
        1 for c in password
        if c.isdigit()
    )

    special = len(
        re.findall(
            r'[^a-zA-Z0-9]',
            password
        )
    )

    unique_chars = len(set(password))

    if length > 0:

        prob = [
            password.count(c)/length
            for c in set(password)
        ]

        entropy = -sum(
            p * math.log2(p)
            for p in prob
        )

    else:
        entropy = 0

    sequences = [
        "123",
        "234",
        "345",
        "abc",
        "bcd",
        "cde"
    ]

    has_sequence = int(
        any(
            seq in password.lower()
            for seq in sequences
        )
    )

    common_pattern = int(
        any(
            p in password.lower()
            for p in COMMON_PATTERNS
        )
    )

    return [
        length,
        upper,
        lower,
        digits,
        special,
        unique_chars,
        round(entropy, 4),
        has_sequence,
        common_pattern
    ]


# ======================
# Load Model
# ======================

def load_model():

    global _model

    if _model is None:

        if not os.path.exists(MODEL_PATH):

            raise FileNotFoundError(
                f"rf_model.pkl not found → {MODEL_PATH}"
            )

        _model = joblib.load(MODEL_PATH)

    return _model


# ======================
# Minimal Validation
# ======================

def validate(password):

    if len(password.strip()) == 0:

        return "weak"

    if len(password) < 3:

        return "weak"

    return None


# ======================
# Main Prediction
# ======================

def classify_password(password):

    validation = validate(password)

    if validation:

        return {
            "strength": validation,
            "suggestion": SUGGESTIONS[validation]
        }

    model = load_model()

    features = extract_features(password)

    features_df = pd.DataFrame(
        [features],
        columns=FEATURE_NAMES
    )

    prediction = model.predict(
        features_df
    )[0]

    strength = LABEL_MAP.get(
        int(prediction),
        "weak"
    )

    return {
        "strength": strength,
        "suggestion": SUGGESTIONS[strength]
    }


# ======================
# Testing
# ======================

if __name__ == "__main__":

    password = input(
        "Enter Password: "
    )

    result = classify_password(
        password
    )

    print(result)