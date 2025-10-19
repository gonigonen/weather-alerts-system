import { notification } from 'antd';

interface UseWebhookProps {
  onTableUpdate?: () => void;
  onAlertTriggered?: (payload: any) => void;
}

export const useWebhook = ({ onTableUpdate, onAlertTriggered }: UseWebhookProps = {}) => {
  // No polling - just expose simulation method for testing
  const simulateWebhook = (payload: any) => {
    console.log('📡 Simulated webhook:', payload);
    
    if (payload.type === 'alert_triggered') {
      notification.warning({
        message: '🚨 Weather Alert',
        description: payload.message,
        placement: 'topRight',
        duration: 8,
        style: {
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
        },
      });
      
      if (onAlertTriggered) {
        onAlertTriggered(payload);
      }
    }
    
    if (onTableUpdate) {
      onTableUpdate();
    }
  };

  return {
    simulateWebhook,
    isActive: false,
  };
};
