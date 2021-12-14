from utils.config import ( names, movies )

movies_all_fields = [movie for movie in movies.find_one({})]

movies_required_fields = [movie for movie in movies.find_one(
    {},
    {
        "_id" : 0,
        "imdb_title_id": 0,
        "reviews" : 0
    }
)]

reviews_required_fields = ['review', 'sentiment']