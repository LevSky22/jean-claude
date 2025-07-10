import { useEffect } from 'react';
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RateLimitToastProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function RateLimitToast({
  isVisible,
  onClose,
}: RateLimitToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <Alert 
      className="fixed top-4 right-4 max-w-xs bg-[#EF4135] text-white border-none shadow-lg animate-in slide-in-from-top-5 duration-300 z-50"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />

      <AlertDescription className="text-white font-medium">
        <span className="sr-only">Limite de débit atteinte : </span>
        Doucement, mon ami—too many messages 👀
      </AlertDescription>
    </Alert>
  );
}
