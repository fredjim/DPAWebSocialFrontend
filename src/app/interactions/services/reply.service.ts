import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reply } from '../models/reply';
import { CreateReply } from '../models/create-reply';

@Injectable({
  providedIn: 'root'
})
export class ReplyService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;
  private readonly commentsUrl = 'comments';
  private readonly repliesUrl = 'replies';

  constructor(
    private readonly http: HttpClient
  ) {}

  getRepliesByCommentUuid(commentUuid: string): Observable<Reply[]> {
    return this.http.get<Reply[]>(
      `${this.ROOT_URL}/${this.commentsUrl}/${commentUuid}/${this.repliesUrl}`
    );
  }

  addReply(commentUuid: string, replyData: CreateReply): Observable<Reply> {
    return this.http.post<Reply>(
      `${this.ROOT_URL}/${this.commentsUrl}/${commentUuid}/${this.repliesUrl}`,
      replyData
    );
  }

  deleteReply(replyUuid: string): Observable<void> {
    return this.http.delete<void>(
      `${this.ROOT_URL}/${this.repliesUrl}/${replyUuid}`
    );
  }
}