import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { WebService } from '../web.service';
import { map, startWith } from 'rxjs/operators';
import { Movie } from '../interfaces/movie';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-movies',
    templateUrl: './movies.component.html',
    styleUrls: ['./movies.component.css']
})
export class MoviesComponent implements OnInit {
    movies_list?: Movie[];
    page: number = 1;
    maxPage: number = 1;
    myControl = new FormControl();
    filteredOptions$?: Observable<any>;
    options: string[] = [];
    genre?: string;
    language?: string;
    director?: string;
    year?: number;
    noResultsFound?: boolean;

    constructor(
        private webService: WebService,
    ) { }

    ngOnInit(): void {
        if(sessionStorage['page'] && sessionStorage['filters']){
            const page = sessionStorage['page'];
            const filters = JSON.parse(sessionStorage['filters']);
            this.page = page;
            this.webService.getMoviesByFilters(filters, page)
                .subscribe((data: any) => {
                    this.webService.passMoviesByFilters({ 
                        results: data.value, count: data.totalCount 
                    });
                });
        }

        this.webService.getPassedMoviesResults()
            .subscribe((data: any) => {
                this.movies_list = data.results;
                this.maxPage = Math.ceil(data.count / 12);
            });

        this.filteredOptions$ = this.myControl.valueChanges.pipe(
            startWith(''),
            map((value: any) => {
                return typeof value === 'string' && value.length > 3 ? 
                value : value.original_title
            }),
            map((original_title: any) => {
                return original_title ? 
                this.filterLowerCase(original_title) : this.options.slice(0, 0)
            }),
        );
        this.webService.getAllMovieTitles().subscribe((data: any) => {
            this.options = data;
        });
    }

    private filterLowerCase(name: string): string[] {
        const filteredValue = name.toLowerCase();

        return this.options.filter((option: any) => {
            return option.original_title.toString().toLowerCase().includes(filteredValue)
        });
    }

    displayText(movie: Movie): string {
        return movie && movie.original_title ? movie.original_title : '';
    }

    public calculateRating(movie: Movie): string {
        let positive_count = 0
        let review_count = 0
        movie['reviews'].forEach(review => { 
            if(review['sentiment'] === 'positive') positive_count++;
            review_count++;
        });
        const rating = positive_count / review_count * 10;
        return rating.toFixed(1);
    }

    fetchMoviesWithFilters(page: number): void {
        let value = this.myControl.value;
        if(typeof value === 'object' && value !== null) value = value['original_title']; 
        if(value ||
            this.genre || 
            this.language || 
            this.director || 
            this.year
        ){
            const filters = {
                "original_title": value,
                "genre": this.genre,
                "language": this.language,
                "director": this.director,
                "year": this.year
            }
            this.webService.getMoviesByFilters(filters, page)
                .subscribe((data: any) => {
                    if(data){
                        this.webService.passMoviesByFilters({ 
                            results: data.value, count: data.totalCount 
                        });
                        sessionStorage['filters'] = JSON.stringify(filters);
                        sessionStorage['page'] = page
                        this.noResultsFound = false;
                    } else {
                        this.noResultsFound = true;
                        this.movies_list = [];
                    }
                });
        }    
    }

    fetchMovieList(page: number): void {
        this.fetchMoviesWithFilters(page);
    }

    searchMovies(): void {
        this.fetchMoviesWithFilters(this.page);
    }
}