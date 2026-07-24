import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Post } from '../models/post';
import { CreatePost } from '../models/create-post';
import { UploadedMedia } from '../../shared/models/uploaded-media';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;
  private readonly postsUrl = 'posts';

  constructor(
    private readonly http: HttpClient
  ) {}

  // ── Lectura ──────────────────────────────────────────────────────────────────

  getPost(postUuid: string): Observable<Post> {
    return this.http.get<Post>(`${this.ROOT_URL}/${this.postsUrl}/${postUuid}`);
  }

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.ROOT_URL}/${this.postsUrl}`);
  }

  getPostsByType(postType: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.ROOT_URL}/${this.postsUrl}?type=${postType}`);
  }

  getPagedPosts(pageNumber: number): Observable<Post[]> {
    return this.http.get<Post[]>(
      `${this.ROOT_URL}/${this.postsUrl}/paged?page=${pageNumber}&size=5`
    );
  }

  // ── Escritura ─────────────────────────────────────────────────────────────────

  createPost(dataPost: CreatePost): Observable<Post> {
    return this.http.post<Post>(`${this.ROOT_URL}/${this.postsUrl}`, dataPost);
  }

  updatePost(postUuid: string, dataPost: CreatePost): Observable<Post> {
    return this.http.put<Post>(
      `${this.ROOT_URL}/${this.postsUrl}/${postUuid}`,
      dataPost
    );
  }

  deletePost(postUuid: string): Observable<Post> {
    return this.http.delete<Post>(
      `${this.ROOT_URL}/${this.postsUrl}/${postUuid}`
    );
  }

  // ── Upload de media ───────────────────────────────────────────────────────────

  uploadImages(formData: FormData): Observable<UploadedMedia[]> {
    return this.http.post<UploadedMedia[]>(
      `${this.ROOT_URL}/images/posts`,
      formData
    );
  }

  uploadVideos(formData: FormData): Observable<UploadedMedia[]> {
    return this.http.post<UploadedMedia[]>(
      `${this.ROOT_URL}/videos/posts`,
      formData
    );
  }

  uploadMedia(formData: FormData): Observable<UploadedMedia[]> {
    const imagesFormData = new FormData();
    const videosFormData = new FormData();

    formData.forEach((file, key) => {
      if (file instanceof File) {
        if (file.type.startsWith('image/')) imagesFormData.append(key, file);
        else if (file.type.startsWith('video/')) videosFormData.append(key, file);
      }
    });

    const observables: Observable<UploadedMedia[]>[] = [];
    if (imagesFormData.has('images')) observables.push(this.uploadImages(imagesFormData));
    if (videosFormData.has('videos')) observables.push(this.uploadVideos(videosFormData));

    return forkJoin(observables).pipe(map(results => results.flat()));
  }

  uploadDocument(formData: FormData): Observable<UploadedMedia[]> {
    return this.http.post<UploadedMedia[]>(
      `${this.ROOT_URL}/documents/posts`,
      formData
    );
  }
}