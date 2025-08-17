import { useNotifications } from '@/context/NotificationContext';

export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  const showSuccess = (title: string, message: string, duration?: number) => {
    addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  };

  const showError = (title: string, message: string, duration?: number) => {
    addNotification({
      type: 'error',
      title,
      message,
      duration: duration ?? 8000, // Errors stay longer by default
    });
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  };

  const showProductSuccess = (action: 'created' | 'updated' | 'deleted', productName: string) => {
    const actionText = action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'deleted';
    showSuccess(
      `Product ${actionText}`,
      `"${productName}" has been ${actionText} successfully.`,
      4000
    );
  };

  const showProductError = (action: 'creating' | 'updating' | 'deleting', errorMessage: string) => {
    const actionText = action === 'creating' ? 'creating' : action === 'updating' ? 'updating' : 'deleting';
    showError(
      `Failed to ${actionText} product`,
      errorMessage || `An error occurred while ${actionText} the product.`,
      6000
    );
  };

  const showUserSuccess = (action: 'created' | 'updated' | 'deleted', userName: string) => {
    const actionText = action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'deleted';
    showSuccess(
      `User ${actionText}`,
      `"${userName}" has been ${actionText} successfully.`,
      4000
    );
  };

  const showUserError = (action: 'creating' | 'updating' | 'deleting', errorMessage: string) => {
    const actionText = action === 'creating' ? 'creating' : action === 'updating' ? 'updating' : 'deleting';
    showError(
      `Failed to ${actionText} user`,
      errorMessage || `An error occurred while ${actionText} the user.`,
      6000
    );
  };

  const showOrderSuccess = (action: 'created' | 'updated' | 'processed', orderId: string) => {
    const actionText = action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'processed';
    showSuccess(
      `Order ${actionText}`,
      `Order #${orderId} has been ${actionText} successfully.`,
      4000
    );
  };

  const showOrderError = (action: 'creating' | 'updating' | 'processing', errorMessage: string) => {
    const actionText = action === 'creating' ? 'creating' : action === 'updating' ? 'updating' : 'processing';
    showError(
      `Failed to ${actionText} order`,
      errorMessage || `An error occurred while ${actionText} the order.`,
      6000
    );
  };

  const showAuthSuccess = (action: 'logged in' | 'logged out' | 'registered') => {
    showSuccess(
      `Authentication ${action}`,
      `You have successfully ${action}.`,
      3000
    );
  };

  const showAuthError = (action: 'logging in' | 'logging out' | 'registering', errorMessage: string) => {
    showError(
      `Authentication failed`,
      `Failed to ${action}: ${errorMessage}`,
      6000
    );
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showProductSuccess,
    showProductError,
    showUserSuccess,
    showUserError,
    showOrderSuccess,
    showOrderError,
    showAuthSuccess,
    showAuthError,
  };
};
