import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Bridge for auth service
  localId: string = "";
  uid: string = "";
  token: string = "";

  constructor() {
    this.initLocalID();
    this.initUID();
  }

  private initLocalID() {
    const li = localStorage.getItem("li");
    if (li) {
      this.localId = li;
    } else {
      this.localId = (+new Date()).toString(36);
      localStorage.setItem("li", this.localId);
    }
  }
  private initUID() {
    const uid = localStorage.getItem("uid");
    if (uid) {
      this.uid = uid;
    }
  }
}
