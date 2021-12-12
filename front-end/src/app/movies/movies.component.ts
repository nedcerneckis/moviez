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

    constructor(
        private webService: WebService,
    ) { }

    ngOnInit(): void {
        if (sessionStorage['page']) {
            this.page = Number(sessionStorage['page']);
        }

        this.webService.getPassedMoviesResults()
            .subscribe((data: any) => {
                this.movies_list = data.results;
                this.maxPage = Math.ceil(data.count / 12);
            });

        this.filteredOptions$ = this.myControl.valueChanges.pipe(
            startWith(''),
            map((value: any) => {
                return typeof value === 'string' && value.length > 3 ? value : value.original_title
            }),
            map((original_title: any) => {
                return original_title ? this.filterLowerCase(original_title) : this.options.slice(0, 0)
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

    fetchMovieList(page: number): void {
        if(this.myControl.value){
            this.webService.getMoviesByFilters(this.myControl.value, page)
                .subscribe((data: any) => {
                    this.webService.passMoviesByFilters({ results: data.value, count: data.totalCount })
                });
        }
    }

    searchMovies(): void {
        let value = this.myControl.value;
        if(typeof value === 'object') value = value['original_title']; 
        console.log(`${this.language} ${this.director} ${this.year} ${this.genre} `);
        console.log(value);
        if(value){
            this.webService.getMoviesByFilters(value, this.page)
                .subscribe((data: any) => {
                    this.webService.passMoviesByFilters({ results: data.value, count: data.totalCount })
                });
        }    
    }
}