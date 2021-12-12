import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class WebService {

    api_hostname: string = 'http://localhost';
    api_port: string = ':5000';
    api_path: string = '/api/v1.0';
    api_full_url: string = this.api_hostname + this.api_port + this.api_path;

    moviesFiltersSearchResults = new Subject();

    constructor(
        public http: HttpClient
    ) { }

    getMovies(page: number): Observable<any> {
        return this.http.get(this.api_full_url + '/movies?pn=' + page);
    }

    getMoviesByFilters(searchTerm: string, page: number): Observable<any> {
        return this.http.get(this.api_full_url + '/movies/search?' + 
            'original_title=' + searchTerm + 
            '&pn=' + page
        );
    }

    passMoviesByFilters(results: any): void {
        this.moviesFiltersSearchResults.next(results);
    }

    getPassedMoviesResults(): Observable<any> {
        return this.moviesFiltersSearchResults.asObservable();
    }

    getAllMovieTitles(): Observable<any> {
        return this.http.get(this.api_full_url + '/movies/titles');
    }

    getSpecificMovie(id: string): Observable<any> {
        return this.http.get(this.api_full_url + '/movies/' + id);
    }

    getImagePoster(id: string): Observable<any> {
        return this.http.get(this.api_full_url + '/movies/img/' + id);
    }

    getRating(id: string): Observable<any> {
        return this.http.get(this.api_full_url + '/movies/' + id + '/rating');
    }

    getMaxPage(): Observable<any> {
        return this.http.get(this.api_full_url + '/movies/maxpage');
    }

    getReviewMaxPage(id: string): Observable<any> {
        return this.http.get(this.api_full_url + '/movies/' + id + '/reviews/maxpage');
    }

    getReviews(id: string, page: number): Observable<any> {
        return this.http.get(this.api_full_url + '/movies/' + id + '/reviews?pn=' + page);
    }

    addMovie() {
    }

    updateMovie() {
    }

    deleteMovie() {

    }
}