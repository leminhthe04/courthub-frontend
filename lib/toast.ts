import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
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
