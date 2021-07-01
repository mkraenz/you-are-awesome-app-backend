import axios from "axios";
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

async function fetchPosts(uri: string) {
    const res = await axios.get<PostWithDate[]>(uri);
    // NOTE: capital letters in the google sheets header (= names of the json's properties)
    // will be converted to all small letters
    const posts = res.data;
    if (!Array.isArray(posts)) {
        throw new Error(
            `Failed to fetch posts. Expected to receive an array, found ${typeof posts}`
        );
    }
    return posts;
}
