import { PostWithDate } from "./IPost";
import { toIsoDateString } from "./toTodayString";

export const maybeGetTodaysPost = (
    now: Date,
    posts: PostWithDate[]
): PostWithDate | undefined => {
    const today = toIsoDateString(now);
    // why does Array.find() not have return type T | undefined?
    return posts.find(post => post.isodate.slice(0, 10) === today);
};
