import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { retry, catchError } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class RoomService {
  apiURL = "https://localhost:44336/api/" + "Room/";

  constructor(private http: HttpClient) {}

  // HttpClient API get() -> Create new room and return the room name
  joinNewRoom(peerId: string): Observable<string> {
    return this.http
      .get<string>(this.apiURL + "Room/JoinNewRoom?peerId=" + peerId)
      .pipe(retry(1), catchError(this.handleError));
  }

  // HttpClient API get() -> Join existing room
  joinExistingRoom(peerId: string, roomName: string) {
    this.http
      .get<any>(this.apiURL + "Room/JoinExistingRoom?peerId=" + peerId + '&roomName=' + roomName)
      .pipe(retry(1), catchError(this.handleError));
  }

  // Error handling
  handleError(error) {
    let errorMessage = "";
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = "Error from serve!";
    }

    window.alert(errorMessage);
    return throwError(errorMessage);
  }
}
