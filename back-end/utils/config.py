from pymongo import MongoClient

# API config
URL_PREFIX = "/api/v1.0"
API_HOSTNAME = "http://localhost:"
API_PORT = "5000"

# MongoDB config
client = MongoClient('mongodb://127.0.0.1:27017')
db = client.moviezDB
movies = db.movies
names = db.names