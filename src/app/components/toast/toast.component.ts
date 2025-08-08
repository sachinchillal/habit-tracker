import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent implements OnInit {

  constructor(public toastService: ToastService) { }

  ngOnInit(): void { }

  showSuccessToast() {
    this.toastService.showToastAuto('Successfully saved!', 'Your changes have been saved.', 'success');
  }

  showErrorToast() {
    this.toastService.showToastAuto('Error processing request.', 'Please try again later.', 'error');
  }
}
