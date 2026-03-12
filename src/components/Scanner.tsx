import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera as CameraIcon, Upload, X, Zap, Image as ImageIcon, Barcode } from 'lucide-react';
import { analyzeFoodImage, analyzeProductData, AnalysisResult } from '../services/gemini';
import { db, collection, addDoc, auth } from '../firebase';
import { Html5Qrcode } from 'html5-qrcode';
import { getProductByBarcode } from '../services/off';

interface ScannerProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
  isAnalyzing: boolean;
}

export default function Scanner({ onAnalysisStart, onAnalysisComplete, isAnalyzing }: ScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (showBarcodeScanner) {
      const startScanner = async () => {
        try {
          const html5QrCode = new Html5Qrcode("barcode-reader");
          scannerRef.current = html5QrCode;
          
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 150 }
            },
            async (decodedText) => {
              // Stop scanner on success
              await html5QrCode.stop();
              setShowBarcodeScanner(false);
              handleBarcodeScanned(decodedText);
            },
            undefined
          );
        } catch (err) {
          console.error("Scanner start error:", err);
          setError("Could not start barcode scanner. Please check camera permissions.");
          setShowBarcodeScanner(false);
        }
      };
      startScanner();
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [showBarcodeScanner]);

  const handleBarcodeScanned = async (barcode: string) => {
    onAnalysisStart();
    setError(null);
    try {
      const product = await getProductByBarcode(barcode);
      if (!product) {
        throw new Error("Product not found in database.");
      }
      
      const result = await analyzeProductData(product);
      
      if (auth.currentUser) {
        await addDoc(collection(db, 'scans'), {
          uid: auth.currentUser.uid,
          productName: result.productName,
          timestamp: new Date(),
          analysis: result,
          barcode: barcode
        });
      }
      
      onAnalysisComplete(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to find product by barcode.");
    }
  };

  const processImage = async (imageSrc: string) => {
    onAnalysisStart();
    setError(null);
    try {
      const result = await analyzeFoodImage(imageSrc);
      
      // Save to history
      if (auth.currentUser) {
        await addDoc(collection(db, 'scans'), {
          uid: auth.currentUser.uid,
          productName: result.productName,
          timestamp: new Date(),
          analysis: result,
          imageUrl: imageSrc.length < 100000 ? imageSrc : null
        });
      }
      
      onAnalysisComplete(result);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please try again with a clearer photo.");
    }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      processImage(imageSrc);
    }
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (showCamera) {
    return (
      <div className="relative bg-black rounded-3xl overflow-hidden aspect-[3/4] shadow-2xl">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "environment" }}
          className="w-full h-full object-cover"
          disablePictureInPicture={true}
          forceScreenshotSourceSize={false}
          imageSmoothing={true}
          mirrored={false}
          onUserMedia={() => {}}
          onUserMediaError={() => {}}
          screenshotQuality={0.92}
        />
        <div className="absolute inset-0 border-2 border-emerald-500/30 pointer-events-none">
          <div className="absolute inset-12 border-2 border-white/50 rounded-2xl border-dashed" />
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
          <button
            onClick={() => setShowCamera(false)}
            className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={capture}
            disabled={isAnalyzing}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-16 h-16 border-4 border-emerald-600 rounded-full" />
          </button>
          <div className="w-14" />
        </div>
      </div>
    );
  }

  if (showBarcodeScanner) {
    return (
      <div className="relative bg-black rounded-3xl overflow-hidden aspect-[3/4] shadow-2xl">
        <div id="barcode-reader" className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-40 border-2 border-emerald-500 rounded-lg relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-pulse" />
          </div>
        </div>
        <button
          onClick={() => setShowBarcodeScanner(false)}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-emerald-200">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Ready to Scan?</h2>
          <p className="text-emerald-50/80 text-sm mb-6">Point your camera at the ingredients list or nutrition facts of any food package.</p>
          <button
            onClick={() => setShowCamera(true)}
            className="bg-white text-emerald-600 font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-md hover:bg-emerald-50 transition-colors"
          >
            <CameraIcon className="w-5 h-5" />
            Open Camera
          </button>
        </div>
        <Zap className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <Upload className="w-6 h-6 text-stone-500 group-hover:text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-stone-600 group-hover:text-emerald-700">Upload Photo</span>
        </label>

        <button 
          onClick={() => setShowBarcodeScanner(true)}
          className="bg-white border border-stone-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-emerald-200 transition-all group"
        >
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <Barcode className="w-6 h-6 text-stone-500 group-hover:text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-stone-600 group-hover:text-emerald-700">Scan Barcode</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm flex items-start gap-3">
          <X className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-stone-100 rounded-3xl p-6">
        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Tips for better results</h4>
        <ul className="space-y-3 text-sm text-stone-600">
          <li className="flex gap-2">
            <span className="text-emerald-600 font-bold">01</span>
            Ensure good lighting and avoid glare on plastic.
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 font-bold">02</span>
            Keep the text flat and centered in the frame.
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 font-bold">03</span>
            Capture both ingredients and nutrition table if possible.
          </li>
        </ul>
      </div>
    </div>
  );
}
