from flask import Blueprint, request, jsonify
import requests
import time
from functools import wraps

data_blueprint = Blueprint("data", __name__)

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)
        if not auth_header:
            return jsonify({"error": "Authorization header is missing"}), 401

        parts = auth_header.split()
        if parts[0].lower() != "bearer":
            return jsonify({"error": "Authorization header must start with Bearer"}), 401
        elif len(parts) == 1:
            return jsonify({"error": "Token not found"}), 401
        elif len(parts) > 2:
            return jsonify({"error": "Authorization header must be a single Bearer token"}), 401

        token = parts[1]

        try:
            response = requests.get(
                "https://www.googleapis.com/oauth2/v3/tokeninfo",
                params={"access_token": token},
            )
            if response.status_code != 200:
                return jsonify({"error": "Invalid token"}), 401

            token_info = response.json()
            print("Token info:", token_info)

            # Validate token expiration
            if "exp" in token_info and time.time() > int(token_info["exp"]):
                return jsonify({"error": "Token has expired"}), 401

            # Validate required scopes
            required_scopes = {"https://www.googleapis.com/auth/userinfo.email"}
            if not required_scopes.issubset(set(token_info.get("scope", "").split())):
                return jsonify({"error": "Insufficient token scopes"}), 403

        except Exception as e:
            return jsonify({"error": f"Token validation failed: {str(e)}"}), 500

        return f(*args, **kwargs)
    return decorated
