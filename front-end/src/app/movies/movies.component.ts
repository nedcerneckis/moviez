import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { WebService } from '../web.service';
import { map, startWith } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { FilterDialogComponent } from './filter-dialog/filter-dialog.component';
import { Movie } from '../interfaces/movie';

@Component({
    selector: 'app-movies',
    templateUrl: './movies.component.html',
    styleUrls: ['./movies.component.css']
})
export class MoviesComponent implements OnInit {
    movies_list?: Movie[];
    page: number = 1;
    maxPage: number = 0;
    myControl = new FormControl();
    filteredOptions: any;
    options: any[] = [];
    searchNameTerm?: string;

    constructor(
        private webService: WebService,
        public filterDialog: MatDialog
    ) { }

    ngOnInit(){
        if (sessionStorage['page']) {
            this.page = Number(sessionStorage['page']);
        }
        this.webService.getMovies(this.page).subscribe((data: any) => {
            this.movies_list = data;
        });
        this.webService.getMaxPage().subscribe((data: any) => {
            this.maxPage = data['max_page'];
        });
        this.filteredOptions = this.myControl.valueChanges.pipe(
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

    private filterLowerCase(name: string): any {
        const filteredValue = name.toLowerCase();
        
        return this.options.filter((option: any) => {
            return option.original_title.toString().toLowerCase().includes(filteredValue)
        });
    }

    displayText(movie: any): string {
        return movie && movie.original_title ? movie.original_title : '';
    }

    openFilterDialog(){
        const dialogRef = this.filterDialog.open(FilterDialogComponent, {
            width: '600px',
            data: {searchNameTerm: this.searchNameTerm}
        });

        dialogRef.afterClosed().subscribe(result => {
            this.searchNameTerm = result;
        });
    }

    onSubmitClick(): any {
        if (this.myControl.value) {
            this.webService.getMoviesByFilters(this.myControl.value)
                .subscribe((data: any) => {
                    this.movies_list = data;
                });
        }
    }

    updatePagination(): any{
        sessionStorage['page'] = this.page;
        this.webService
            .getMovies(this.page)
            .subscribe((data: any) => {
                this.movies_list = data;
            });
    }

    getPageArray() {
        if (this.maxPage > 5) {
            if (this.page > 3 && this.page <= (this.maxPage - 2)) {
                return [...Array(5).keys()].map(x => x + (this.page - 2));
            } else if (this.page > (this.maxPage - 2)) {
                return [...Array(5).keys()].map(x => x + (this.maxPage - 4));
            } else {
                return [...Array(5).keys()].map(x => x + 1);
            }
        } else {
            return [...Array(this.maxPage).keys()].map(x => x + 1);
        }
    }

    firstPage() {
        this.page = 1;
        this.updatePagination()
    }

    previousPage() {
        if (this.page > 1) {
            this.page--;
            this.updatePagination()
        }
    }

    goToPage(page: number) {
        this.page = page;
        this.updatePagination()
    }

    nextPage() {
        if (this.page < this.maxPage) {
            this.page++;
            this.updatePagination()
        }
    }

    lastPage() {
        this.page = this.maxPage;
        this.updatePagination()
    }
}