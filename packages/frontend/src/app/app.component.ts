import { Component, OnInit, signal }                  from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive }  from '@angular/router';
import { ButtonModule }                                from 'primeng/button';
import { ToastModule }                                 from 'primeng/toast';
import { TooltipModule }                               from 'primeng/tooltip';
import { ThemeService }                                from './core/theme.service';
import { MessageService } from 'primeng/api';

@Component({
  selector:   'app-root',
  standalone: true,
  imports:    [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, ToastModule, TooltipModule],
  providers:  [MessageService],
  templateUrl: './app.component.html',
  styleUrl:    './app.component.scss',
})
export class AppComponent implements OnInit {
  collapsed = signal(false);

  constructor(public theme: ThemeService) {}

  ngOnInit() { this.theme.init(); }

  isDark()    { return this.theme.mode() === 'dark'; }
  toggle()    { this.collapsed.update(v => !v); }
}