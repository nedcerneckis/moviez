from bson import ObjectId
from flask import request

def form_data_is_invalid(required_fields = []):
    requested_fields = [x[0] for x in request.form.items()]
    for field in required_fields:
        if field not in requested_fields:
            return True
    return False

def id_is_valid(id):
    return ObjectId.is_valid(id)