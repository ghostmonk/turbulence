from functools import wraps
from flask import request, jsonify
from google.oauth2 import id_token
from google.auth.transport import requests
import os

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            
            client_id = os.environ.get('GOOGLE_CLIENT_ID')
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                client_id
            )
            
            if idinfo['aud'] != client_id:
                raise ValueError('Wrong audience.')
            
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
            
    return decorated
