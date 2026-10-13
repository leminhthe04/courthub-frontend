import Swal, { type SweetAlertOptions } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const toastClasses = {
  popup: 'courthub-swal-toast',
  title: 'courthub-swal-title',
  htmlContainer: 'courthub-swal-text',
  icon: 'courthub-swal-icon',
  timerProgressBar: 'courthub-swal-progress',
};

const confirmClasses = {
  popup: 'courthub-swal-confirm',
  title: 'courthub-swal-title',
  htmlContainer: 'courthub-swal-text',
  icon: 'courthub-swal-icon',
  confirmButton: 'courthub-swal-confirm-button',
  cancelButton: 'courthub-swal-cancel-button',
};

export const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  customClass: toastClasses,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export const showToast = {
  success: (title: string, text?: string) => {
    return Toast.fire({
      icon: 'success',
      title,
      text,
    });
  },
  error: (title: string, text?: string) => {
    return Toast.fire({
      icon: 'error',
      title,
      text,
    });
  },
  info: (title: string, text?: string) => {
    return Toast.fire({
      icon: 'info',
      title,
      text,
    });
  },
  warning: (title: string, text?: string) => {
    return Toast.fire({
      icon: 'warning',
      title,
      text,
    });
  },
};

export const showConfirm = (options: SweetAlertOptions) =>
  Swal.fire({
    icon: 'warning',
    showCancelButton: true,
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    ...options,
    customClass: {
      ...confirmClasses,
      ...(options.customClass ?? {}),
    },
  });
