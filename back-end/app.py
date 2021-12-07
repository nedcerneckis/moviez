from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
from functools import wraps
from bson import ObjectId
from bs4 import BeautifulSoup
import requests
import json
import re
import math

from utils.http_response import error_response, http_response_json, http_response
from utils.pagination import get_page_size, get_page_start, get_review_page_size, get_review_page_start
from utils.validation import form_data_is_invalid, id_is_valid
from utils.config import ( 
    API_HOSTNAME,
    API_PORT,
    URL_PREFIX, 
    movies, 
    names
)
from utils.fields import ( 
    reviews_required_fields,
    movies_required_fields,
)

app = Flask(__name__)
CORS(app)

@app.errorhandler(404)
def page_not_found(error):
    return error_response("Resource not found", 404)

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
        year = request.args.get("year")
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
            match["$match"]["year"] = int(year)
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
        movies_to_return = []
        for movie in movies.aggregate(aggregation):
            movie['_id'] = str(movie['_id'])
            for review in movie['reviews']:
                review['_id'] = str(review['_id'])
            movies_to_return.append(movie)

        return http_response_json(movies_to_return, 200)

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

@app.route(URL_PREFIX + "/movies", methods=["POST"])
def add_movie():
    if form_data_is_invalid(movies_required_fields):
        return error_response("Form data is invalid", 404)
    new_movie = {}
    number_regex = r'^[0-9]+$'
    for field in movies_required_fields:
        match = re.search(number_regex, request.form[field])
        if match:
            new_movie[field] = int(request.form[field])
            continue
        new_movie[field] = request.form[field]
    new_movie["reviews"] = []
    new_movie_id = movies.insert_one(new_movie)
    new_movie_link = API_HOSTNAME + API_PORT + URL_PREFIX + "/movies/" \
        + str(new_movie_id.inserted_id)

    return make_response( jsonify( {"url": new_movie_link} ), 201)

@app.route(URL_PREFIX + "/movies/<string:id>", methods=["PUT"])
def edit_movie(id):
    if id_is_valid(id):
        if form_data_is_invalid(movies_required_fields):
            return error_response("Missing form data", 404)
        else:
            result = movies.update_one(
                {
                    "_id" : ObjectId(id)
                },
                {
                    "$set" : {
                        "original_title": request.form["original_title"],
                        "year": request.form["year"],
                        "genre": request.form["genre"],
                        "duration": request.form["duration"],
                        "language": request.form["language"],
                        "director": request.form["director"],
                        "production_company": request.form["production_company"],
                        "actors": request.form["actors"],
                        "description": request.form["description"],
                    }
                }
            )
            if result.matched_count == 1:
                edited_movie_link = API_HOSTNAME + API_PORT + URL_PREFIX + "/movies/" + id
                return http_response("url", edited_movie_link, 200)
            else:
                return error_response("Movie not found", 404)

    else:
        return error_response("Invalid movie ID", 404)

@app.route(URL_PREFIX + "/movies/<string:id>", methods=["DELETE"])
def delete_movie(id):
    if id_is_valid(id):
        delete_result = names.delete_one({
            "_id" : ObjectId(id)
        })
        if delete_result.deleted_count == 1:
            return http_response_json({}, 204)
        else:
            return error_response("Movie not found", 404)
    else:
        return error_response("Invalid movie ID", 404)

@app.route(URL_PREFIX + "/movies/<string:id>/reviews", methods=['POST'])
def add_movie_review(id):
    if id_is_valid(id):
        movie = movies.find_one({ "_id": ObjectId(id)})
        if movie is not None:
            if form_data_is_invalid(reviews_required_fields):
                return error_response("Form data is invalid", 404)
            else:
                new_review = {
                    '_id': ObjectId(),
                    'username': request.form['username'],
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


"""
@app.route(URL_PREFIX + '/names', methods=["GET"])
def show_all_names():
    page_size = get_page_size(request)
    page_start = get_page_start(request)

    names_list = []
    for person in names.find().skip(page_start).limit(page_size):
        person['_id'] = str(person['_id'])
        for film in person['filmography']:
            film['_id'] = str(film['_id'])
        names_list.append(person)

    return http_response_json(names_list, 200)

@app.route(URL_PREFIX + "/names/<string:id>", methods=["GET"])
def show_one_name(id):
    if id_is_valid(id):
        person = names.find_one({'_id':ObjectId(id)})
        name = []
        if person is not None:
            person['_id'] = str(person['_id'])
            for film in person['filmography']:
                film['_id'] = str(film['_id'])
            
            name.append(person)
            return http_response_json(name, 200)
        else:
            return error_response("Name not found", 404)
    else:
        return error_response("Invalid name ID", 404)

@app.route(URL_PREFIX + "/names", methods=["POST"])
def add_name():
    if form_data_is_invalid(names_required_fields):
        return error_response("Form data is invalid", 404)
    new_name = {}
    for field in names_required_fields:
        new_name[field] = request.form[field]
    new_name["filmography"] = []
    new_name_id = names.insert_one(new_name)
    new_name_link = API_HOSTNAME + API_PORT + URL_PREFIX + "/names/" \
        + str(new_name_id.inserted_id)

    return make_response( jsonify( {"url": new_name_link} ), 201)

@app.route(URL_PREFIX + "/names/<string:id>", methods=["PUT"])
def edit_name(id):
    if id_is_valid(id):
        if form_data_is_invalid(names_required_fields):
            return error_response("Missing form data", 404)
        else:
            result = names.update_one(
                {
                    "_id" : ObjectId(id)
                },
                {
                    "$set" : {
                        "name": request.form["name"],
                        "bio": request.form["bio"],
                        "date_of_birth": request.form["date_of_birth"],
                        "place_of_birth": request.form["place_of_birth"],
                        "date_of_death": request.form["date_of_death"]

                    }
                }
            )
            if result.matched_count == 1:
                edited_name_link = API_HOSTNAME + API_PORT + URL_PREFIX + "/names/" + id
                return http_response("url", edited_name_link, 200)
            else:
                return error_response("Name not found", 404)

    else:
        return error_response("Invalid name ID", 404)

@app.route(URL_PREFIX + "/names/<string:id>", methods=["DELETE"])
def delete_name(id):
    if id_is_valid(id):
        delete_result = names.delete_one({
            "_id" : ObjectId(id)
        })
        if delete_result.deleted_count == 1:
            return http_response_json({}, 204)
        else:
            return error_response("Name not found", 404)
    else:
        return error_response("Invalid name ID", 404)
"""

if __name__ == "__main__":
    app.run(debug=False)