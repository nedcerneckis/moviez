import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnInit {
    @Input() maxPage: number = 1;
    @Input() page: number = 1;
    @Output() updateItemsList = new EventEmitter();

    constructor(
    ) { }

    ngOnInit(): void {
    }

    updatePagination(): void {
        sessionStorage['page'] = this.page;
        this.updateItemsList.emit(this.page)
    }

    getPageArray(): number[] {
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

    firstPage(): void {
        this.page = 1;
        this.updatePagination()
    }

    previousPage(): void {
        if (this.page > 1) {
            this.page--;
            this.updatePagination()
        }
    }

    goToPage(page: number): void {
        this.page = page;
        this.updatePagination()
    }

    nextPage(): void {
        if (this.page < this.maxPage) {
            this.page++;
            this.updatePagination()
        }
    }

    lastPage(): void {
        this.page = this.maxPage;
        this.updatePagination()
    }
}
