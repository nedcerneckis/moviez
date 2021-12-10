import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { WebService } from '../web.service';
import { map, startWith } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { FilterDialogComponent } from './filter-dialog/filter-dialog.component';
import { Movie } from '../interfaces/movie';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-movies',
    templateUrl: './movies.component.html',
    styleUrls: ['./movies.component.css']
})
export class MoviesComponent implements OnInit {
    movies_list: any;
    page: number = 1;
    maxPage: number = 0;
    myControl = new FormControl();
    filteredOptions$?: Observable<any>;
    options: string[] = [];
    searchNameTerm?: string;

    constructor(
        private webService: WebService,
        public filterDialog: MatDialog
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

    fetchMovieList(page: number): void {
        this.webService
            .getMovies(page)
            .subscribe((data: any) => {
                this.movies_list = data;
            });
    }

    openFilterDialog(): void {
        const dialogRef = this.filterDialog.open(FilterDialogComponent, {
            width: '600px',
            data: { searchNameTerm: this.searchNameTerm }
        });

        dialogRef.afterClosed().subscribe(result => {
            this.searchNameTerm = result;
        });
    }

    onSubmitClick(): void {
        if (this.myControl.value) {
            this.webService.getMoviesByFilters(this.myControl.value)
                .subscribe((data: any) => {
                    this.movies_list = data;
                });
        }
    }
}