import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, label = "Quay lại" }) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2 hover:bg-gray-50 transition-colors w-fit"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </Button>
  );
};

export default BackButton;
