import { Component, OnInit } from '@angular/core';

declare const Peer: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  peer: any;
  myid: any;
  anotherid: any;

  constructor() { }

  ngOnInit() {
    this.peer = new Peer();

    setTimeout(() => {
      this.myid = this.peer.id;
    }, 3000);

    this.peer.on('connection', conn => {
      conn.on('data', data => {
        console.log(data);
      })
    });
  }

  connect() {
    var conn = this.peer.connect(this.anotherid);
    conn.on('open', () => {
      console.log("Sending messages...");
      conn.send('hi');
    });
  }

}
