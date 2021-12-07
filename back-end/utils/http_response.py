from flask import jsonify, make_response

def http_response_json(json, http_status):
    return make_response(jsonify(json), http_status)

def http_response(k_message, v_message, http_status):
    return make_response(jsonify({
        k_message: v_message
    }), http_status)

def error_response(err_message, http_status):
    return make_response(jsonify({
        "error": err_message
    }), http_status)