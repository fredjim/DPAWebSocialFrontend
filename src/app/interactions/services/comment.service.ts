import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comment } from '../models/comment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;
  private readonly commentsUrl = 'comments';
  private readonly postsUrl = 'posts';

  constructor(
    private readonly http: HttpClient
  ) {}

  // ── Comentarios ───────────────────────────────────────────────────────────────

  getComments(postUuid: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(
      `${this.ROOT_URL}/${this.postsUrl}/${postUuid}/${this.commentsUrl}`
    );
  }

  addComment(postUuid: string, commentData: { content: string }): Observable<Comment> {
    return this.http.post<Comment>(
      `${this.ROOT_URL}/post/${postUuid}/${this.commentsUrl}`,
      commentData
    );
  }

  deleteComment(postUuid: string, commentUuid: string): Observable<void> {
    return this.http.delete<void>(
      `${this.ROOT_URL}/${this.postsUrl}/${postUuid}/${this.commentsUrl}/${commentUuid}`
    );
  }
}