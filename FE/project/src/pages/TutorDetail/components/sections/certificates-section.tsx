import { useState } from "react";
import { Award, X, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Certificate {
  certificateId?: number;
  certificateID?: number;
  certificateName: string;
  certificateURL?: string;
  documentUrl?: string;
  issuedDate?: string;
  expiryDate?: string;
}

interface CertificatesSectionProps {
  certificates: Certificate[];
}

const CertificatesSection = ({ certificates }: CertificatesSectionProps) => {
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  if (!certificates || certificates.length === 0) {
    return null;
  }

  const getCertificateUrl = (cert: Certificate) => {
    return cert.certificateURL || cert.documentUrl || '';
  };

  const getCertificateId = (cert: Certificate) => {
    return cert.certificateID || cert.certificateId || 0;
  };

  const handleCertClick = (cert: Certificate) => {
    setSelectedCert(cert);
    setIsOpen(true);
  };

  return (
    <>
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-yellow-500" />
          Chứng chỉ & Bằng cấp
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {certificates.map((cert) => {
            const certId = getCertificateId(cert);
            
            return (
              <button
                key={certId}
                onClick={() => handleCertClick(cert)}
                className="group block w-full text-left"
              >
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-xl">
                  {/* Certificate Thumbnail */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
                    {/* Certificate Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Certificate Name */}
                    <p className="text-xs font-semibold text-gray-800 text-center line-clamp-3 px-2">
                      {cert.certificateName}
                    </p>
                    
                    {/* Dates */}
                    {cert.issuedDate && (
                      <p className="text-[10px] text-gray-500 mt-2 text-center">
                        {new Date(cert.issuedDate).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-blue-600/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Award className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-semibold">Xem chi tiết</p>
                    </div>
                  </div>

                  {/* Badge for verified/official certificates */}
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-1 rounded-full font-semibold shadow-md">
                    ✓ Xác thực
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Certificate Detail Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              {selectedCert?.certificateName}
            </DialogTitle>
          </DialogHeader>

          {selectedCert && (
            <div className="space-y-6">
              {/* Certificate Preview */}
              <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl p-8 border-2 border-gray-200">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Award className="w-12 h-12 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 text-center">
                    {selectedCert.certificateName}
                  </h3>

                  {/* Certificate Details */}
                  <div className="w-full max-w-md space-y-3 text-sm">
                    {selectedCert.issuedDate && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600 font-medium">📅 Ngày cấp:</span>
                        <span className="text-gray-900 font-semibold">
                          {new Date(selectedCert.issuedDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}

                    {selectedCert.expiryDate && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600 font-medium">⏰ Ngày hết hạn:</span>
                        <span className="text-gray-900 font-semibold">
                          {new Date(selectedCert.expiryDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-700 font-medium">✓ Trạng thái:</span>
                      <span className="text-green-700 font-semibold">Đã xác thực</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                {getCertificateUrl(selectedCert) && (
                  <a
                    href={getCertificateUrl(selectedCert)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Xem chứng chỉ gốc
                  </a>
                )}
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  <X className="w-5 h-5" />
                  Đóng
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CertificatesSection;
