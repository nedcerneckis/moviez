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
    movies_list: Movie[] = [];
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

        this.fetchMovieList(this.page);

        this.webService.getMaxPage().subscribe((data: any) => {
            this.maxPage = data['max_page'];
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

    fetchMovieList(page: number,): void {
        this.webService
            .getMovies(page)
            .subscribe((data: any) => {
                this.movies_list = data;
            });
    }

    handleParams(): string[]{
        const params: any = {}
        if(this.myControl.value){
            params['original_title'] = this.myControl.value;
        }
        if(this.genre){
            params['genre'] = this.genre;
        }
        if(this.language){
            params['language'] = this.language;
        }
        if(this.year){
            params['year'] = this.year;
        }
        return params;
    }

    expandFilterOptions(): void {
    }

    onSubmitClick(): void {
        if (this.myControl.value) {
            this.webService.getMoviesByFilters(this.myControl.value, this.page)
                .subscribe((data: any) => {
                    this.movies_list = data;
                });
        }
    }
}