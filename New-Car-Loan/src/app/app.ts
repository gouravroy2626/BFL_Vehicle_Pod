import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Tracker } from './shared/components/tracker/tracker';

@Component({
  selector: 'app-root',
  standalone: true,
  // register shared components used in the app shell
  imports: [RouterOutlet, Navbar, Tracker],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('New-Car-Loan');
}
