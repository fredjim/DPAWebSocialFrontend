import { Link } from "./link";
import { MediaArticle } from "./media-article";
import { UploadedMediaArticle } from "./uploaded-media-article";

export interface CreateUpdateArticle {
    uuid:       string;
    section_id: string;
    user_id:    string;
    title:      string;
    text:       string;
    date:       string;
    medias:     (MediaArticle | UploadedMediaArticle)[];
    links:      Link[];
}