import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class WebService {

    api_hostname = 'http://localhost';
    api_port = ':5000';
    api_path = '/api/v1.0';
    api_full_url = this.api_hostname + this.api_port + this.api_path;

    constructor(
        public http: HttpClient
    ){}

    getMovies(page: number): any{
        return this.http.get(this.api_full_url + '/movies?pn=' + page);
    }

    getMoviesByFilters(searchTerm: string): any{
        return this.http.get(this.api_full_url + '/movies/search?original_title=' + searchTerm);
    }

    getAllMovieTitles(): any {
        return this.http.get(this.api_full_url + '/movies/titles');
    }

    getSpecificMovie(id: string): any{
        return this.http.get(this.api_full_url + '/movies/' + id);
    }

    getImagePoster(id: string){
        return this.http.get(this.api_full_url + '/movies/img/' + id);
    }

    getRating(id: string){
        return this.http.get(this.api_full_url + '/movies/' + id + '/rating');
    }

    getMaxPage(){
        return this.http.get(this.api_full_url + '/movies/maxpage');
    }

    getReviewMaxPage(id: string){
        return this.http.get(this.api_full_url + '/movies/' + id + '/reviews/maxpage');
    }

    getReviews(id: string, page: number){
        return this.http.get(this.api_full_url + '/movies/' + id + '/reviews?pn=' + page);
    }

    addMovie(){

    }

    updateMovie(){
    }

    deleteMovie(){

    }
}