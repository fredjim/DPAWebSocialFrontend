import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../authentication/services/auth.service';
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

  private readonly reqHeader = {
    headers: new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.getToken() })
  };

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  getRepliesByCommentUuid(commentUuid: string): Observable<Reply[]> {
    return this.http.get<Reply[]>(
      `${this.ROOT_URL}/${this.commentsUrl}/${commentUuid}/${this.repliesUrl}`
    );
  }

  addReply(commentUuid: string, replyData: CreateReply): Observable<Reply> {
    return this.http.post<Reply>(
      `${this.ROOT_URL}/${this.commentsUrl}/${commentUuid}/${this.repliesUrl}`,
      replyData,
      this.reqHeader
    );
  }

  deleteReply(replyUuid: string): Observable<void> {
    return this.http.delete<void>(
      `${this.ROOT_URL}/${this.repliesUrl}/${replyUuid}`,
      this.reqHeader
    );
  }
}