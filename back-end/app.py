from os import error
from flask import Flask, request
from flask_cors import CORS
from functools import wraps
from bson import ObjectId
from bs4 import BeautifulSoup
import requests
import json
import math
import jwt
import datetime
import bcrypt

from utils.http_response import error_response, http_response_json, http_response
from utils.pagination import get_page_size, get_page_start, get_review_page_size, get_review_page_start
from utils.validation import form_data_is_invalid, id_is_valid
from utils.config import ( 
    API_HOSTNAME,
    API_PORT,
    URL_PREFIX,
    movies,
    users,
    blacklist
)
from utils.fields import ( 
    reviews_required_fields,
)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'mysecret'
CORS(app)

def jwt_required(func):
    @wraps(func)
    def jwt_required_wrapper(*args, **kwargs):
        token = None
        if('x-access-token' in request.headers):
            token = request.headers['x-access-token']
        if(not token):
            http_response("message", "Token is missing", 401)
        try:
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except:
            return http_response("message", "Token is invalid", 401)
        blacklist_token = blacklist.find_one({
            "token": token
        })
        if blacklist_token is not None:
            return http_response("message", "Token has been cancelled", 401)
        return func(*args, **kwargs)
    return jwt_required_wrapper

def admin_required(func):
    @wraps(func)
    def admin_required_wrapper(*args, **kwargs):
        token = request.headers['x-access-token']
        data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        if data["admin"]:
            return func(*args, **kwargs)
        else:
            return http_response("message", "Admin access required", 401)
    return admin_required_wrapper

@app.errorhandler(404)
def page_not_found():
    return error_response("Resource not found", 404)

@app.route(URL_PREFIX + "/login", methods=["POST"])
def login():
    auth = request.authorization

    if auth:
        user = users.find_one({
            "username": auth.username
        })
        if user is not None:
            if (bcrypt.checkpw(bytes(auth.password, "UTF-8"), user["password"])):
                token = jwt.encode({
                    "user": auth.username,
                    "admin": user["admin"],
                    "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
                }, app.config['SECRET_KEY'])
                return http_response("token", token, 200)
            else:
                error_response("Incorrect password", 401)
        else:
            return error_response("Incorrect username", 401)
    else:
        return error_response("Authentication required", 401)

@app.route(URL_PREFIX + '/logout', methods=["POST"])
def logout():
    token = request.headers['x-access-token']
    blacklist.insert_one({
        "token": token
    })
    return http_response("message", "Logout successful", 200)

@app.route(URL_PREFIX + '/register', methods=["POST"])
def register_new_user():
    user = request.get_json()
    if("username" in user and
        "password" in user and
        "first_name" in user and
        "surname" in user
    ):
        result = users.find_one({
            "username": user["username"]
        })
        if(result is None):
            users.insert_one({
                "_id": ObjectId(),
                "username": user["username"],
                "password": bcrypt.hashpw(bytes(user["password"], "utf-8"), bcrypt.gensalt()),
                "admin": False,
                "first_name": user["first_name"],
                "surname": user["surname"],
                "favourite_movies": []
            })

            return http_response("message", "User created", 201)
        else:
            return error_response("User already exists", 409)
    else:
        return error_response("Invalid user form data", 400)

@app.route(URL_PREFIX + '/user', methods=["GET"])
@jwt_required
def get_user_details():
    token = request.headers['x-access-token']
    data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    user = users.find_one({
        "username": data['user']
    })
    if(user):
        if(len(user['favourite_movies']) >= 1):
            for movie in user['favourite_movies']:
                movie['_id'] = str(movie['_id'])
        user['_id'] = str(user['_id'])
        del user['password']
        return http_response_json(user, 200)
    else:
        return error_response("User not found", 404)

@app.route(URL_PREFIX + '/user/movie/<string:id>', methods=["POST"])
@jwt_required
def add_movie_to_favourites(id):
    token = request.headers['x-access-token']
    data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    user = users.find_one({
        "username": data['user']
    })
    movie = movies.find_one(
        {
            "_id": ObjectId(id)
        },
        {
            "_id": 1,
            "original_title" : 1
        }
    )
    if(movie):
        users.update_one(
            {
                '_id': ObjectId(user['_id'])
            },
            {
                '$push': {
                    'favourite_movies': movie
                }
            }
        )
        return http_response("success", "Movie added", 201)
    else:
        return error_response("Movie not found", 404)

@app.route(URL_PREFIX + '/user/movie/<string:id>', methods=["DELETE"])
@jwt_required
def delete_movie_from_favourites(id):
    token = request.headers['x-access-token']
    data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    user = users.find_one({
        "username": data['user']
    })
    if(user):
        users.update_one(
            {
                '_id': ObjectId(user['_id'])
            },
            {
                "$pull" : {
                    "favourite_movies" : { 
                        "_id" : ObjectId(id) 
                    }
                }
            }
        )
        return http_response_json({}, 204)
    else:
        return error_response("User not found", 404)

@app.route(URL_PREFIX + '/movies', methods=["GET"])
def show_all_movies():
    page_size = get_page_size(request)
    page_start = get_page_start(request)
    movies_list = []
    for movie in movies.find().sort("_id", -1).skip(page_start).limit(page_size):
        movie['_id'] = str(movie['_id'])
        for review in movie['reviews']:
            review['_id'] = str(review['_id'])
        movies_list.append(movie)

    return http_response_json(movies_list, 200)

@app.route(URL_PREFIX + '/movies/titles', methods=["GET"])
def show_all_movie_titles():
    movie_titles = []
    for movie in movies.aggregate([{
            "$project": {
                "_id": 0,
                "original_title": 1
            }
        }
    ]):
        movie_titles.append(movie)

    return http_response_json(movie_titles, 200)


@app.route(URL_PREFIX + '/movies/img/<string:id>', methods=["GET"])
def scrape_movie_image_url(id):
    if id_is_valid(id):
        movie = movies.find_one({'_id':ObjectId(id)})
        imdb_url = "http://www.imdb.com/title/"
        request = requests.get(imdb_url + movie['imdb_title_id']).content
        soup = BeautifulSoup(request, 'html.parser')

        movie_image_url = json.loads( str(soup.findAll('script', {
            'type' : 'application/ld+json'
        })[0].text))['image']
        single_movie = []
        single_movie.append({"url": movie_image_url})


        return http_response_json(single_movie, 200)
    else:
        return error_response("Invalid movie ID", 404)

@app.route(URL_PREFIX + '/movies/maxpage', methods=['GET'])
def get_max_page_movies():
    total_documents = movies.count()
    page_size = get_page_size(request) 
    max_page = math.ceil(total_documents / page_size)

    return http_response("max_page", max_page, 200)

@app.route(URL_PREFIX + '/movies/<string:id>/reviews/maxpage', methods=['GET'])
def get_max_page_specific_review(id):
    for movie in movies.aggregate([
        {
            "$match": {
                "_id": ObjectId(id)
            }
        },
        {
            "$project": {
                "_id": "$_id",
                "totalReviews": {
                    "$size": "$reviews"
                }
            }
        }
    ]):
        total_Reviews = movie['totalReviews']
    page_size = get_review_page_size(request) 
    max_page = math.ceil(total_Reviews / page_size)

    return http_response("max_page", max_page, 200)

@app.route(URL_PREFIX + '/movies/<string:id>/rating', methods=['GET'])
def get_movie_rating(id):
    if id_is_valid(id):
        movie = movies.find_one({'_id':ObjectId(id)})
        positive_count = 0
        for review in movie['reviews']:
            if review['sentiment'] == 'positive':
                positive_count = positive_count + 1
        rating = (positive_count / len(movie['reviews'])) * 5
        return http_response("rating", round(rating, 1), 200)
    else:
        return error_response("Invalid movie ID", 404)

@app.route(URL_PREFIX + '/movies/search', methods=['GET'])
def show_movies_by_name():
    if all(category is None for category in request.args):
        return error_response("No query parameters supplied", 404)
    else:
        page_size = get_page_size(request)
        page_start = get_page_start(request)
        original_title = request.args.get("original_title")
        genre = request.args.get("genre")
        year = request.args.get("year", type=int)
        director = request.args.get("director")
        language = request.args.get("language")
        match = {
            "$match": {
            }
        }
        if(original_title):
            match["$match"]["original_title"] = {
                "$regex": original_title,
                "$options": "i"
            }
        if(genre):
            match["$match"]["genre"] = {
                "$regex": genre,
                "$options": "i"
            }
        if(language):
            match["$match"]["language"] = {
                "$regex": language,
                "$options": "i"
            }
        if(director):
            match["$match"]["director"] = {
                "$regex": director,
                "$options": "i"
            }
        if(year):
            match["$match"]["year"] = year
        skip = {
            "$skip": page_start
        }
        limit = {
            "$limit": page_size
        }
        aggregation = [
            match,
            skip,
            limit
        ]
        aggregationCount = [
            match,
            {
                "$count": "totalCount"
            }
        ]
        movies_to_return = []
        moviesAndTotalCount = {}
        for movie in movies.aggregate(aggregation):
            movie['_id'] = str(movie['_id'])

            for review in movie['reviews']:
                review['_id'] = str(review['_id'])
            movies_to_return.append(movie)
        totalCount = {}
        for movie in movies.aggregate(aggregationCount):
            totalCount = movie
        if(movies_to_return == []):
            moviesAndTotalCount['value'] = movies_to_return
            moviesAndTotalCount['totalCount'] = 0
            return http_response_json(moviesAndTotalCount, 204)
        else:
            moviesAndTotalCount['value'] = movies_to_return
            moviesAndTotalCount['totalCount'] = totalCount['totalCount']
            return http_response_json(moviesAndTotalCount, 200)

@app.route(URL_PREFIX + "/movies/<string:id>", methods=["GET"])
def show_one_movie(id):
    if id_is_valid(id):
        movie = movies.find_one({'_id':ObjectId(id)})
        individual_film = []
        if movie is not None:
            movie['_id'] = str(movie['_id'])
            for review in movie['reviews']:
                review['_id'] = str(review['_id'])
            
            individual_film.append(movie)
            return http_response_json(individual_film, 200)
        else:
            return error_response("Movie not found", 404)
    else:
        return error_response("Invalid movie ID", 404)


@app.route(URL_PREFIX + "/movies/<string:id>", methods=["DELETE"])
@jwt_required
@admin_required
def delete_movie(id):
    if id_is_valid(id):
        delete_result = movies.delete_one({
            "_id" : ObjectId(id)
        })
        if delete_result.deleted_count == 1:
            return http_response_json({}, 204)
        else:
            return error_response("Movie not found", 404)
    else:
        return error_response("Invalid movie ID", 404)

@app.route(URL_PREFIX + "/movies/<string:id>/reviews", methods=['POST'])
@jwt_required
def add_movie_review(id):
    if id_is_valid(id):
        movie = movies.find_one({ "_id": ObjectId(id)})
        if movie is not None:
            if form_data_is_invalid(reviews_required_fields):
                return error_response("Form data is invalid", 400)
            else:
                new_review = {
                    '_id': ObjectId(),
                    'review': request.form['review'],
                    'sentiment': request.form['sentiment']
                }
                movies.update_one(
                    {
                        '_id': ObjectId(id)
                    },
                    {
                        '$push': {
                            'reviews': new_review
                        }
                    }
                )
                new_review_link = API_HOSTNAME + API_PORT + URL_PREFIX + '/movies/' + \
                    id + '/reviews/' + str(new_review['_id'])
                return http_response("url", new_review_link, 201)
        else:
            return error_response("Movie not found", 404)
    else:
        return error_response("Invalid movie ID", 404)
        

@app.route(URL_PREFIX + "/movies/<string:id>/reviews", methods=['GET'])
def get_movie_reviews(id):
    if id_is_valid(id):
        page_size = get_review_page_size(request)
        page_start = get_review_page_start(request)
        reviews_to_return = []
        movie = movies.find_one(
            {
                "_id": ObjectId(id)
            }, 
            {
                "_id": 0,
                "reviews": 1
            }
        )
        if movie is not None:
            for review in movie['reviews']:
                review['_id'] = str(review['_id'])
                reviews_to_return.append(review)
            reviews_to_return = reviews_to_return[page_start:]
            reviews_to_return = reviews_to_return[:page_size]
            return http_response_json(reviews_to_return, 200)
        else:
            return error_response("Movie not found", 404)
    else:
        return error_response("Invalid movie ID", 404)

@app.route(URL_PREFIX + "/movies/<string:id>/reviews/<string:r_id>", methods=["PUT"])
@jwt_required
def edit_review(id, r_id):
    if id_is_valid(id) and id_is_valid(r_id):
        edited_review = {
            "reviews.$.sentiment" : request.form["sentiment"],
            "reviews.$.review" : request.form["review"],
        }
        movies.update_one(
            {
                "_id": ObjectId(id),
                "reviews._id" : ObjectId(r_id)
            },
            {
                "$set" : edited_review
            }
        )
        edited_review_url = API_HOSTNAME + API_PORT + URL_PREFIX + \
            "/movies/" + id + "/reviews/" + r_id
        return http_response("url", edited_review_url, 200)
    else:
        error_response("MovieID or ReviewID is invalid", 404)

@app.route(URL_PREFIX + "/movies/<string:id>/reviews/<string:r_id>", methods=["DELETE"])
@jwt_required
def delete_review(id, r_id):
    if id_is_valid(id) and id_is_valid(r_id):
        movies.update_one(
            {
                "_id" : ObjectId(id)
            },
            {
                "$pull" : {
                    "reviews" : { 
                        "_id" : ObjectId(r_id) 
                    }
                }
            }
        )
        return http_response_json({}, 204)
    else:
        error_response("MovieID or ReviewID is invalid", 404)

if __name__ == "__main__":
    app.run(debug=False)