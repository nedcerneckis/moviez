import { Review } from "./review";

export interface Movie {
    _id: string,
    imdb_title_id: string,
    original_title: string,
    year: number,
    genre: string,
    duration: number,
    language: string,
    director: string,
    production_company: string,
    actors: string,
    description: string,
    reviews: Review[]
}