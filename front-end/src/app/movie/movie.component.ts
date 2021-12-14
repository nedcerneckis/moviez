import { Component, OnInit } from '@angular/core';
import { WebService } from '../web.service';
import { ActivatedRoute } from '@angular/router';
import { Review } from '../interfaces/review';
import { Observable } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { Location } from '@angular/common';

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
    reviewForm: any;

    constructor(
        private webService: WebService,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private location: Location
    ){ }

    ngOnInit(): void {
        /*
        if (sessionStorage['page']) {
            this.page = Number(sessionStorage['page']);
        }
        */

        this.reviewForm = this.formBuilder.group({
            review: ['', Validators.required],
            sentiment: ['', Validators.required]
        })

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

    ngOnChanges(): void {
        console.log('stuff chaanged')
    }

    ngOnDestroy(): void {
        console.log('stuff destroyed')
    }

    onBackButtonClick(){
        this.location.back();
    }

    onReviewDelete(id: string): void {
        this.webService.deleteReview(id).subscribe();
        this.fetchReviewList(this.page);
    }

    onSubmit(): void {
        this.webService.postReview(this.reviewForm.value)
            .subscribe((data: any) => {
                this.fetchReviewList(this.page);
                console.log('posted review')
            });
        this.reviewForm.reset();
    }

    fetchReviewList(page: number): void {
        this.webService
            .getReviews(this.route.snapshot.params['id'], page)
            .subscribe((data: any) => {
                this.reviews_list = data;
            });
    }
}