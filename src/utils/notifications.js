import Swal from 'sweetalert2';

// Toast notification configuration
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

// Loading notification
export const showLoading = (message = 'Loading...') => {
  return Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Hide loading notification
export const hideLoading = () => {
  Swal.close();
};

// Success toast
export const showSuccess = (message, title = 'Success!') => {
  return Toast.fire({
    icon: 'success',
    title: title,
    text: message
  });
};

// Error toast
export const showError = (message, title = 'Error!') => {
  return Toast.fire({
    icon: 'error',
    title: title,
    text: message
  });
};

// Warning toast
export const showWarning = (message, title = 'Warning!') => {
  return Toast.fire({
    icon: 'warning',
    title: title,
    text: message
  });
};

// Info toast
export const showInfo = (message, title = 'Info') => {
  return Toast.fire({
    icon: 'info',
    title: title,
    text: message
  });
};

// Confirmation dialog
export const showConfirm = (message, title = 'Are you sure?', confirmText = 'Yes', cancelText = 'Cancel') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  });
};

// Custom notification
export const showCustom = (options) => {
  return Swal.fire(options);
};

// Button loading state helper
export const setButtonLoading = (button, loading = true, text = 'Loading...') => {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = text;
    button.style.opacity = '0.6';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
    button.style.opacity = '1';
    delete button.dataset.originalText;
  }
};

// API call wrapper with loading and error handling
export const withLoading = async (apiCall, loadingMessage = 'Loading...', successMessage = null, errorMessage = null) => {
  showLoading(loadingMessage);

  try {
    const result = await apiCall();
    hideLoading();

    if (successMessage) {
      showSuccess(successMessage);
    }

    return result;
  } catch (error) {
    hideLoading();

    const message = errorMessage || (error.message || 'An error occurred');
    showError(message);

    throw error;
  }
};

// Alternative API call wrapper that doesn't show loading (for background calls)
export const withErrorHandling = async (apiCall, errorMessage = null) => {
  try {
    return await apiCall();
  } catch (error) {
    const message = errorMessage || (error.message || 'An error occurred');
    showError(message);
    throw error;
  }
};

// Prevent double submission helper
export const preventDoubleClick = (callback, delay = 1000) => {
  let isProcessing = false;

  return async (...args) => {
    if (isProcessing) return;

    isProcessing = true;

    try {
      await callback(...args);
    } finally {
      setTimeout(() => {
        isProcessing = false;
      }, delay);
    }
  };
};

const notifications = {
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirm,
  showCustom,
  setButtonLoading,
  withLoading,
  preventDoubleClick
};

export default notifications;