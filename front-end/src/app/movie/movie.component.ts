import { Component, OnInit } from '@angular/core';
import { WebService } from '../web.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-movie',
    templateUrl: './movie.component.html',
    styleUrls: ['./movie.component.css']
})
export class MovieComponent implements OnInit {
    movie_poster: any;
    reviews_list: any = [];
    page: any = 1;
    maxPage: any;
    movie_list: any;

    constructor(
        private webService: WebService,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.movie_list = this.webService
            .getSpecificMovie(this.route.snapshot.params['id']);

        this.movie_poster = this.webService
            .getImagePoster(this.route.snapshot.params['id']);

        this.webService.getReviews(this.route.snapshot.params['id'], this.page)
            .subscribe((data: any) => {
                this.reviews_list = data;
            });
        this.webService.getReviewMaxPage(this.route.snapshot.params['id'])
            .subscribe((data: any) => {
                this.maxPage = data['max_page'];
            });
    }

    updateReviewsList(): void{
        this.webService
            .getReviews(this.route.snapshot.params['id'], this.page)
            .subscribe((data: any) => {
                this.reviews_list = data;
            });
    }

    /*
    updatePagination() {
        this.webService
            .getReviews(this.route.snapshot.params['id'], this.page)
            .subscribe((data: any) => {
                this.reviews_list = data;
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
    */
}