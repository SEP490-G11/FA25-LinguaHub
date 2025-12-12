import { useState, useEffect } from "react";
import Turnstile from "react-turnstile";

interface TurnstileGuardProps {
  onVerified: (token: string | null) => void;
  onError?: () => void;
}

export function TurnstileGuard({ onVerified, onError }: TurnstileGuardProps) {
  const [key, setKey] = useState(0);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      console.error("[Turnstile] VITE_TURNSTILE_SITE_KEY not configured");
    }
  }, [siteKey]);

  const handleVerify = (t: string) => {
    onVerified(t);
  };

  const handleExpire = () => {
    onVerified(null);
  };

  const handleErrorCallback = () => {
    onVerified(null);
    onError?.();
  };

  // Reset widget (useful when payment fails)
  const reset = () => {
    setKey((prev) => prev + 1);
    onVerified(null);
  };

  // Expose reset method via ref if needed
  useEffect(() => {
    (window as any).__turnstileReset = reset;
    return () => {
      delete (window as any).__turnstileReset;
    };
  }, []);

  if (!siteKey) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⚠️ Turnstile chưa được cấu hình. Vui lòng thêm VITE_TURNSTILE_SITE_KEY vào .env
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Turnstile
        key={key}
        sitekey={siteKey}
        onVerify={handleVerify}
        onExpire={handleExpire}
        onError={handleErrorCallback}
        theme="auto"
        size="normal"
      />
    </div>
  );
}
