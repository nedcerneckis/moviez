import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, Subject } from 'rxjs';
import { Review } from './interfaces/review';

@Injectable()
export class WebService {

    api_hostname: string = 'http://localhost';
    api_port: string = ':5000';
    api_path: string = '/api/v1.0';
    api_full_url: string = this.api_hostname + this.api_port + this.api_path;
    user: any;
    private movieId: string = '';

    moviesFiltersSearchResults = new Subject();
    reviewsResults = new Subject();

    constructor(
        public http: HttpClient,
    ) { }

    getMoviesByFilters(filters: any, page: number): Observable<any> {
        let filter_string = ''
        for (const filter in filters){
            if(filters[filter] !== undefined && 
                filters[filter] !== null &&
                filters[filter] !== ''
            ){
                filter_string = filter_string + filter + '=' + filters[filter] + '&'
            }
        }
        if(page){
            filter_string = filter_string + 'pn=' + page.toString();
        }
        return this.http.get(this.api_full_url + '/movies/search?' + 
            filter_string
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
        this.movieId = id;
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
        return this.http.get(this.api_full_url + 
            '/movies/' + id + 
            '/reviews/maxpage'
        );
    }

    getReviews(id: string, page: number): Observable<any> {
        return this.http.get(this.api_full_url + 
            '/movies/' + id + 
            '/reviews?pn=' + page
        );
    }

    passReviewsResults(results: any): void {
        this.reviewsResults.next(results);
    }

    getPassedReviewsResults(): Observable<any> {
        return this.reviewsResults.asObservable();
    }

    postMovie() {
    }

    updateMovie() {
    }

    deleteMovie() {

    }

    postReview(review: Review) {
        const postReviewData = new FormData();
        postReviewData.append('sentiment', review.sentiment);
        postReviewData.append('review', review.review);

        return this.http.post(this.api_full_url + 
            '/movies/' + this.movieId + '/reviews', 
            postReviewData
        );
    }

    updateReview(id: string, review: Review) {
        const updateReviewData = new FormData();
        updateReviewData.append('sentiment', review.sentiment);
        updateReviewData.append('review', review.review);

        return this.http.put(this.api_full_url + 
            '/movies/' + this.movieId + '/reviews/' + id,
            updateReviewData
        );
    }

    deleteReview(id: string) {
        return this.http.delete(this.api_full_url +
            '/movies/' + this.movieId + 
            '/reviews/' + id
        );
    }
}