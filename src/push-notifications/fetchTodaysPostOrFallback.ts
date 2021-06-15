import fetch from "node-fetch";
import { PostWithDate } from "./IPost";
import { todayOrRandomPost } from "./todayOrRandomPost";

export const fetchTodaysPostOrFallback = async (
    env: { FETCH_POSTS_URI?: string } = process.env
) => {
    if (!env.FETCH_POSTS_URI) {
        throw new Error("Missing env var: FETCH_POSTS_URI");
    }
    const posts = await fetchPosts(env.FETCH_POSTS_URI);
    return todayOrRandomPost(posts);
};

async function fetchPosts(uri: string, fetchFn = fetch) {
    const response = await fetchFn(uri);
    // NOTE: capital letters in the google sheets header (= names of the json's properties)
    // will be converted to all small letters
    if (!response.ok) {
        throw new Error(
            `Failed to fetch posts. HTTP status ${response.status} ${response.statusText}`
        );
    }
    const posts: PostWithDate[] = (await response.json()).rows;
    return posts;
}
