import { Component, OnInit } from '@angular/core';
import { WebService } from '../web.service';
import { ActivatedRoute } from '@angular/router';
import { Review } from '../interfaces/review';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-movie',
    templateUrl: './movie.component.html',
    styleUrls: ['./movie.component.css']
})
export class MovieComponent implements OnInit {
    movie_poster: any;
    reviews_list?: Review[];
    page: number = 1;
    maxPage: number = 1;
    movie_list$?: Observable<any>;

    constructor(
        private webService: WebService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.movie_list$ = this.webService
            .getSpecificMovie(this.route.snapshot.params['id']);

        this.webService.getImagePoster(this.route.snapshot.params['id'])
            .subscribe((data: any) => {
                this.movie_poster = data[0]['url'];
            });

        this.fetchReviewList(this.page);

        this.webService.getReviewMaxPage(this.route.snapshot.params['id'])
            .subscribe((data: any) => {
                this.maxPage = data['max_page'];
            });
    }

    fetchReviewList(page: number): void {
        this.webService
            .getReviews(this.route.snapshot.params['id'], page)
            .subscribe((data: any) => {
                this.reviews_list = data;
            });
    }
}