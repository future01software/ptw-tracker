import React, { useEffect, useRef, useState } from 'react';
import { Permit } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { QrCode, Download, Scan } from 'lucide-react';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeGeneratorProps {
  permit: Permit;
  open: boolean;
  onClose: () => void;
}

export function QRCodeGenerator({ permit, open, onClose }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      // Generate QR code with permit information
      const permitData = JSON.stringify({
        id: permit.id,
        permitNumber: permit.permitNumber,
        ptwType: permit.ptwType,
        status: permit.status,
        locationName: permit.locationName
      });

      QRCode.toCanvas(canvasRef.current, permitData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, [open, permit]);

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `permit-qr-${permit.permitNumber}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code - {permit.permitNumber}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <canvas ref={canvasRef} className="border rounded-lg" />
          <div className="text-center">
            <p className="text-sm font-semibold">{permit.permitNumber}</p>
            <p className="text-xs text-muted-foreground">{permit.locationName}</p>
          </div>
          <Button onClick={downloadQRCode} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface QRCodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (permitData: any) => void;
}

export function QRCodeScanner({ open, onClose, onScan }: QRCodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open && scannerRef.current) {
      const html5QrCode = new Html5Qrcode("qr-reader");
      setScanner(html5QrCode);

      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          try {
            const permitData = JSON.parse(decodedText);
            onScan(permitData);
            html5QrCode.stop();
            onClose();
          } catch (err) {
            setError('Invalid QR code format');
          }
        },
        (errorMessage) => {
          // Ignore scan errors (happens continuously while scanning)
        }
      ).catch((err) => {
        setError('Could not start camera. Please allow camera access.');
      });

      return () => {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(console.error);
        }
      };
    }
  }, [open, onScan, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Permit QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div id="qr-reader" ref={scannerRef} className="w-full" />
          {error && (
            <div className="text-sm text-red-600 text-center">{error}</div>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Point your camera at a permit QR code
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// QR Code Button for Permit Details
interface QRCodeButtonProps {
  permit: Permit;
}

export function QRCodeButton({ permit }: QRCodeButtonProps) {
  const [showQR, setShowQR] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setShowQR(true)}>
        <QrCode className="w-4 h-4 mr-2" />
        QR Code
      </Button>
      <QRCodeGenerator permit={permit} open={showQR} onClose={() => setShowQR(false)} />
    </>
  );
}
