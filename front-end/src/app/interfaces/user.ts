import { Movie } from "./movie";

export interface User {
    username: string,
    first_name: string,
    last_name: string,
    favouriteMovies: Movie[]
}