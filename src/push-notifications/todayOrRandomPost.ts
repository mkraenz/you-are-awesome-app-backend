import { random } from "lodash";
import { PostWithDate } from "./IPost";
import { maybeGetTodaysPost } from "./maybeGetTodaysPost";

export function todayOrRandomPost(
    posts: PostWithDate[],
    now = new Date()
): PostWithDate {
    if (posts.length === 0) {
        throw new Error(
            "posts was empty. cannot find today's or a random post"
        );
    }
    const todaysPost = maybeGetTodaysPost(now, posts);
    if (todaysPost) {
        return todaysPost;
    }
    const post = posts[random(posts.length - 1)];
    return post;
}
