"use client";

import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  ImageIcon, 
  Settings2, 
  Download, 
  Briefcase,
  Camera,
  Scissors,
  Printer,
  Upload,
  CheckCircle2,
  Lock,
  ChevronDown
} from 'lucide-react';
import { PHOTO_SIZE_PRESETS } from '@/types';
import { generatePhotoSheet } from '@/utils/generateSheet';

// FAQ Component for accordion
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl mb-3 overflow-hidden bg-white">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center p-5 text-left font-medium hover:bg-gray-50 transition-colors"
      >
        <span className="text-text-main pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-5 pt-0 text-text-muted border-t border-border mt-1">
          {answer}
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);
  const [generatedSheet, setGeneratedSheet] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<'white' | 'blue' | 'gray'>('white');
  const [sizePresetId, setSizePresetId] = useState<string>(PHOTO_SIZE_PRESETS[0].id);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [promoCode, setPromoCode] = useState<string>('');
  
  // ゲストIDと決済状態（セッションベースの一回きり権限）
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isPremiumPaid, setIsPremiumPaid] = useState<boolean>(false);
  const [hasDownloadedSingle, setHasDownloadedSingle] = useState<boolean>(false);
  const [hasDownloadedSheet, setHasDownloadedSheet] = useState<boolean>(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // ゲストIDの初期化と決済状況の確認
  React.useEffect(() => {
    // クライアントサイドでのみ実行
    let currentGuestId = localStorage.getItem('photo_app_guest_id');
    if (!currentGuestId) {
      currentGuestId = crypto.randomUUID();
      localStorage.setItem('photo_app_guest_id', currentGuestId);
    }
    setGuestId(currentGuestId);

    // Stripe Checkout からの成功リダイレクトを検出
    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get('success') === 'true';
    const sessionId = urlParams.get('session_id');

    if (isSuccess && sessionId) {
      // sessionStorage から保存済みの変換画像と設定を復元
      const savedImage = sessionStorage.getItem('photo_converted_image');
      const savedSizePreset = sessionStorage.getItem('photo_size_preset');
      const savedBrightness = sessionStorage.getItem('photo_brightness');
      const savedContrast = sessionStorage.getItem('photo_contrast');

      if (savedImage) {
        setConvertedImage(savedImage);
        setUploadedImageSrc(savedImage); // 元画像の代わりに変換画像を使用
      }
      const restoredPreset = savedSizePreset || PHOTO_SIZE_PRESETS[0].id;
      if (savedSizePreset) setSizePresetId(restoredPreset);
      if (savedBrightness) setBrightness(Number(savedBrightness));
      if (savedContrast) setContrast(Number(savedContrast));

      // 一回きりのプレミアムダウンロード権限を付与
      setIsPremiumPaid(true);
      setHasDownloadedSingle(false);
      setHasDownloadedSheet(false);
      setIsCheckingPayment(false);

      // sessionStorage をクリア
      sessionStorage.removeItem('photo_converted_image');
      sessionStorage.removeItem('photo_size_preset');
      sessionStorage.removeItem('photo_brightness');
      sessionStorage.removeItem('photo_contrast');

      // 台紙を再生成（プレミアム権限あり）
      if (savedImage) {
        generatePhotoSheet(savedImage, restoredPreset, 100, 100, true)
          .then(sheetUrl => setGeneratedSheet(sheetUrl))
          .catch(err => console.error('台紙再生成エラー:', err));
      }

      // URLをクリーンアップ
      const cleanUrl = window.location.pathname + '#editor';
      window.history.replaceState({}, '', cleanUrl);

      // エディタセクションへスクロール
      setTimeout(() => {
        document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return;
    }

    if (urlParams.get('canceled') === 'true') {
      const savedImage = sessionStorage.getItem('photo_converted_image');
      const savedSizePreset = sessionStorage.getItem('photo_size_preset');
      const savedBrightness = sessionStorage.getItem('photo_brightness');
      const savedContrast = sessionStorage.getItem('photo_contrast');

      if (savedImage) {
        setConvertedImage(savedImage);
        setUploadedImageSrc(savedImage);
      }
      const restoredPreset = savedSizePreset || PHOTO_SIZE_PRESETS[0].id;
      if (savedSizePreset) setSizePresetId(restoredPreset);
      if (savedBrightness) setBrightness(Number(savedBrightness));
      if (savedContrast) setContrast(Number(savedContrast));

      sessionStorage.removeItem('photo_converted_image');
      sessionStorage.removeItem('photo_size_preset');
      sessionStorage.removeItem('photo_brightness');
      sessionStorage.removeItem('photo_contrast');

      // 台紙を再生成
      if (savedImage) {
        generatePhotoSheet(savedImage, restoredPreset, 100, 100, false)
          .then(sheetUrl => setGeneratedSheet(sheetUrl))
          .catch(err => console.error('台紙再生成エラー:', err));
      }

      const cleanUrl = window.location.pathname + '#editor';
      window.history.replaceState({}, '', cleanUrl);

      setTimeout(() => {
        document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }

    // 一回きりモデルのため、DBからの永続ステータスチェックは行わない
    setIsCheckingPayment(false);
  }, []);

  // 両方ダウンロード完了後にプレミアム権限を消費
  React.useEffect(() => {
    if (isPremiumPaid && hasDownloadedSingle && hasDownloadedSheet) {
      setIsPremiumPaid(false);
    }
  }, [isPremiumPaid, hasDownloadedSingle, hasDownloadedSheet]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }
    setFile(selectedFile);
    setUploadedImageSrc(URL.createObjectURL(selectedFile));
    setConvertedImage(null);
    setGeneratedSheet(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    if (!droppedFile.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }
    setFile(droppedFile);
    setUploadedImageSrc(URL.createObjectURL(droppedFile));
    setConvertedImage(null);
    setGeneratedSheet(null);
    setError(null);
    setBrightness(100);
    setContrast(100);
    setPromoCode('');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }

  const fileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  };

  const handleConvert = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!file) return;

    setIsConverting(true);
    setError(null);
    setGeneratedSheet(null);

    try {
      const base64Data = await fileToBase64(file);
      const [mimeType, base64Content] = base64Data.split(';base64,');

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Content,
          mimeType: mimeType.split(':')[1],
          backgroundColor: bgColor,
          sizePreset: sizePresetId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '変換に失敗しました');
      }

      const resultDataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
      setConvertedImage(resultDataUrl);
      
      // 画像が生成されたタイミングで台紙も即座に生成
      try {
        const isPremium = promoCode === '20230322' || isPremiumPaid;
        const sheetDataUrl = await generatePhotoSheet(resultDataUrl, sizePresetId, 100, 100, isPremium);
        setGeneratedSheet(sheetDataUrl);
      } catch (err) {
        console.error('自動台紙生成エラー:', err);
      }

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadSheet = async () => {
    if (!convertedImage) return;
    setIsGeneratingSheet(true);
    try {
      const isPremium = promoCode === '20230322' || isPremiumPaid;
      const sheetDataUrl = await generatePhotoSheet(convertedImage, sizePresetId, brightness, contrast, isPremium);
      downloadFile(sheetDataUrl, isPremium ? 'id-photo-sheet-premium' : 'id-photo-sheet');
      // 台紙ダウンロード済みを記録
      if (isPremiumPaid) {
        setHasDownloadedSheet(true);
      }
    } catch (err: unknown) {
      console.error('台紙生成エラー:', err);
      alert('台紙の生成に失敗しました');
    } finally {
      setIsGeneratingSheet(false);
    }
  };

  const handleCheckout = async () => {
    if (!guestId) return;
    setIsCheckoutLoading(true);
    try {
      // 変換画像と設定を sessionStorage に保存（決済後の復元用）
      // ※台紙(generatedSheet)は大容量のため保存せず、復元時に再生成する
      if (convertedImage) {
        sessionStorage.setItem('photo_converted_image', convertedImage);
      }
      sessionStorage.setItem('photo_size_preset', sizePresetId);
      sessionStorage.setItem('photo_brightness', String(brightness));
      sessionStorage.setItem('photo_contrast', String(contrast));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('決済画面への移動に失敗しました。');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const downloadFile = (dataUrl: string, prefix: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${prefix}-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSingle = async () => {
    if (!convertedImage) return;
    
    // Canvasを生成して透かしを焼き込む
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 画像オブジェクトをロード
    const img = new globalThis.Image();
    img.src = convertedImage;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    // 1. 画像に色調補正フィルターを適用して描画
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';
    
    // 2. 透かし文字の描画 (プロモーションコード非合致、かつ未課金の場合のみ)
    const isPremium = promoCode === '20230322' || isPremiumPaid;
    if (!isPremium) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((-25 * Math.PI) / 180);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      const fontSize = Math.floor(canvas.width * 0.15);
      ctx.font = `900 ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText('PREVIEW SAMPLE', 0, -canvas.height * 0.3);
      ctx.fillText('PREVIEW SAMPLE', 0, 0);
      ctx.fillText('PREVIEW SAMPLE', 0, canvas.height * 0.3);
      ctx.restore();
    }
    
    const dataUrl = canvas.toDataURL('image/png');
    downloadFile(dataUrl, isPremium ? 'id-photo-premium' : 'id-photo-preview');

    // 単品ダウンロード済みを記録
    if (isPremiumPaid) {
      setHasDownloadedSingle(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-text-main font-sans selection:bg-gray-100">
      {/* Header */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-text-main text-white flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </span>
            <span className="font-semibold text-lg tracking-tight">ID Photo Studio</span>
          </div>
          
          {/* Header Navigation Link */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-text-muted">
            <a href="#how-to-use" className="hover:text-accent transition-colors">使い方</a>
            <a href="#features" className="hover:text-accent transition-colors">4つの強み</a>
          </nav>

          <div className="text-sm border border-border bg-white text-text-main px-4 py-1.5 rounded-full font-medium shadow-sm hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> 選ばれています
          </div>
        </div>
      </header>

      <main className="flex-grow w-full">
        {/* === HERO & UPLOAD SECTION === */}
        <section className="w-full px-6 py-20 pb-16 flex flex-col items-center bg-gray-50/50">
          <div className="max-w-4xl text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold text-sm mb-6 border border-blue-100">
              <Sparkles className="w-4 h-4" /> AI駆動の証明写真メーカー
            </div>
            
            {/* Added TOP Section Image */}
            <div className="relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden shadow-xl mb-10 border border-border mx-auto max-w-5xl">
              <Image src="/images/lp/TOPセクション.png" alt="ID Photo Converter Hero" fill className="object-cover" priority />
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-text-main leading-[1.2]">
              証明写真の準備、<br className="md:hidden" /><span className="text-accent text-5xl md:text-6xl mx-1">圧倒的</span>にカンタン。
            </h1>
            <p className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-blue-500 mb-6 inline-block">
              業界No.1の高品質。
            </p>
            <p className="text-lg text-text-muted max-w-2xl mx-auto font-medium">
              スマホの写真をドラッグ＆ドロップするだけ。<br className="hidden md:block"/>
              AIが背景透過とスーツ着用を自動処理し、コンビニ印刷用の台紙を無料で生成します。
            </p>
          </div>

          <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-sm border border-border p-6 md:p-10 text-center transition-all hover:shadow-md">
            <div 
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center min-h-[250px] transition-colors cursor-pointer ${uploadedImageSrc && !convertedImage ? 'border-accent bg-accent-light/30' : 'border-border hover:border-gray-400 hover:bg-gray-50'}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !isConverting && fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
              
              {uploadedImageSrc && !isConverting && !convertedImage ? (
                <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border shadow-sm mb-5">
                    <Image src={uploadedImageSrc} alt="Preview" fill className="object-cover" />
                  </div>
                  
                  {/* === PRE-GENERATION SETTINGS === */}
                  <div className="w-full max-w-sm mb-6 space-y-4 text-left">
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-2">背景カラーを選択</label>
                      <div className="flex gap-2">
                        {[
                          { id: 'white', label: '白', color: '#ffffff' },
                          { id: 'blue', label: '青', color: '#eff6ff' },
                          { id: 'gray', label: 'グレー', color: '#f3f4f6' }
                        ].map(bg => (
                          <button
                            key={bg.id}
                            onClick={(e) => { e.stopPropagation(); setBgColor(bg.id as 'white' | 'blue' | 'gray'); }}
                            className={`flex items-center justify-center py-2 px-3 border-2 rounded-lg text-sm transition-all flex-1 gap-2 ${bgColor === bg.id ? 'border-accent bg-accent-light text-accent font-bold ring-2 ring-accent/20' : 'border-border text-text-muted hover:border-gray-300'}`}
                          >
                            <span className="w-4 h-4 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: bg.color }}></span>
                            {bg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-2">証明写真のサイズ</label>
                      <select 
                        value={sizePresetId}
                        onChange={(e) => setSizePresetId(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full border-2 border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer appearance-none bg-white"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                      >
                        {PHOTO_SIZE_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>{p.label} {p.width}x{p.height}mm</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button onClick={(e) => { e.stopPropagation(); handleConvert(); }} className="w-full max-w-sm rounded-xl bg-text-main text-white px-8 py-4 font-bold inline-flex justify-center items-center gap-2 hover:bg-gray-800 transition-all shadow-md hover:scale-105 active:scale-95 text-lg">
                    <Sparkles className="w-5 h-5 text-yellow-400" /> 無料で証明写真を作る
                  </button>
                </div>
              ) : isConverting ? (
                <div className="flex flex-col items-center py-10">
                  <div className="relative w-16 h-16 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-accent animate-pulse" />
                  </div>
                  <div className="text-lg font-bold text-text-main mb-2">AIが画像を解析・変換しています...</div>
                  <div className="text-sm font-medium text-text-muted bg-gray-50 px-4 py-2 rounded-full border border-border">高画質化のため、1分程度お待ちください☕️</div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-border flex items-center justify-center mb-3 group-hover:bg-gray-50 transition-colors">
                    <Upload className="w-7 h-7 text-gray-700" />
                  </div>
                  <span className="font-bold text-xl text-text-main">画像を選択またはドロップ</span>
                  <span className="text-sm text-text-muted font-medium">JPG, PNG, WebP対応 • スマホ撮影OK</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium text-left border border-red-200 flex items-start gap-2">
                <div className="w-5 h-5 flex-shrink-0 mt-0.5">•</div>
                <div><span className="font-bold block mb-1">エラー:</span>{error}</div>
              </div>
            )}
          </div>
        </section>

        {/* === HOW TO USE SECTION === */}
        {(!uploadedImageSrc || !convertedImage) && (
          <section id="how-to-use" className="py-24 px-6 max-w-5xl mx-auto border-t border-border border-dashed scroll-mt-16">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 tracking-tight">驚くほど、シンプル。</h2>
              <p className="text-lg text-text-muted font-bold mb-2">早い・安い・綺麗が揃った写真作成アプリ</p>
              <p className="text-base text-text-muted">たった3ステップで履歴書やパスポート用の写真が完成します。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] bg-border border-dashed border-t-2 z-0"></div>

              <div className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-text-main text-white flex items-center justify-center font-bold text-xl mb-6 shadow-md border-4 border-white">1</div>
                <h3 className="font-bold text-lg mb-2">写真をアップロード</h3>
                <p className="text-sm text-text-muted mb-4">スマホで撮ったいつもの写真をそのままアップロードしてください。</p>
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-100 shadow-sm mt-auto">
                  <Image src="/images/lp/写真アップロード.png" alt="写真アップロード" fill className="object-cover" />
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-text-main text-white flex items-center justify-center font-bold text-xl mb-6 shadow-md border-4 border-white">2</div>
                <h3 className="font-bold text-lg mb-2">AIが自動最適化</h3>
                <p className="text-sm text-text-muted mb-4">一瞬で背景を青や白に透過し、希望すればビジネススーツ姿に変換します。</p>
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-100 shadow-sm mt-auto">
                  <Image src="/images/lp/画像添付・設定プレビュー.png" alt="設定プレビュー" fill className="object-cover" />
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-text-main text-white flex items-center justify-center font-bold text-xl mb-6 shadow-md border-4 border-white">3</div>
                <h3 className="font-bold text-lg mb-2">ダウンロードして印刷</h3>
                <p className="text-sm text-text-muted mb-4">生成されたL判台紙データを保存し、お近くのコンビニで印刷・切り取るだけです。（L版印刷1枚30円〜）</p>
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-100 shadow-sm mt-auto">
                  <Image src="/images/lp/印刷用台紙プレビュー.png" alt="台紙プレビュー" fill className="object-cover" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* === WHY CHOOSE US (4つの強み) === */}
        {(!uploadedImageSrc || !convertedImage) && (
          <section id="features" className="py-24 px-6 border-t border-border border-dashed bg-gray-50/30 scroll-mt-20">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4 tracking-tight">ID Photo Studioの<span className="text-accent text-4xl mx-1">4</span>つの強み</h2>
                <p className="text-lg text-text-muted">わざわざ証明写真機へ行く必要はもうありません。</p>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">圧倒的な安さ（コスト削減）</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  従来の証明写真機（約800円〜1000円）は地味に高いし、行くのも手間。当アプリは、就活生や免許更新、マイナンバーカード申請などで「とりあえず安く済ませたい」層の味方です。低コストで高画質な証明写真をだせるのは最大の強みです。
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">「納得いくまで」何度でも撮り直し放題</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  証明写真機で一番のストレスは「一発勝負（または数回しか撮り直せない）」ことです。変な顔や瞬きをしてしまっても高いお金を払わなければなりません。アプリなら無料で何十回でも生成してプレビューできるため、「奇跡の1枚」ができるまで試行錯誤可能。安心感・満足感を提供します。
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">時間と場所を選ばない（タイパの向上）</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  わざわざ駅前やスーパーまで出向く必要がありません。「あ、明日必要だった！」と深夜に気づいても、自宅でパジャマから上だけ着替えればすぐに作成できます。移動時間と手間の大幅な削減になります。
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">データ管理が楽</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  一度作成した気に入ったデータをスマホに保存できるため、後日別の用途で必要になった時にすぐに使えます（Webエントリーなど）。証明写真機だとデータ受け取りに追加料金がかかる場合も多いため、非常に経済的です。
                </p>
              </div>
            </div>
            </div>
          </section>
        )}

        {/* === DYNAMIC EDITOR & RESULT AREA === */}
        {(uploadedImageSrc && convertedImage) && (
          <section id="editor" className="w-full px-6 py-16 bg-white border-y border-border scroll-mt-20">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-500" /> 証明写真が完成しました
                </h2>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-10 w-full justify-center items-start">
                
                {/* [LARGE] Result Preview Card with Watermark */}
                <div className="w-full lg:w-[60%] flex-shrink-0 bg-white rounded-[24px] shadow-sm border border-border p-6 md:p-10 flex flex-col items-center relative overflow-hidden group">
                  
                  {/* Watermark overlay styling & Dynamic Filter */}
                  <div 
                    className="relative w-full max-w-[400px] aspect-[3/4] shadow-md border border-border overflow-hidden mb-8 rounded-lg pointer-events-none transition-all duration-200"
                    style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                  >
                    <Image src={convertedImage} alt="Converted Photo" fill className="object-contain" />
                    {/* Repeated Watermark Pattern (CSS overlay for preview) - プレミアム時は非表示 */}
                    {!isPremiumPaid && promoCode !== '20230322' && (
                      <div className="absolute inset-0 z-10 opacity-30 flex flex-col justify-around select-none">
                        <div className="w-[150%] -translate-x-10 text-center text-red-500 font-black text-4xl tracking-widest -rotate-[25deg]">PREVIEW SAMPLE</div>
                        <div className="w-[150%] -translate-x-10 text-center text-red-500 font-black text-4xl tracking-widest -rotate-[25deg]">PREVIEW SAMPLE</div>
                        <div className="w-[150%] -translate-x-10 text-center text-red-500 font-black text-4xl tracking-widest -rotate-[25deg]">PREVIEW SAMPLE</div>
                      </div>
                    )}
                  </div>

                  {/* Monetization / Action CTA */}
                  <div className="w-full max-w-[400px] flex flex-col gap-4">
                    {!isPremiumPaid && promoCode !== '20230322' ? (
                      <>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                          <p className="text-sm font-semibold text-yellow-800 mb-1">画質にご満足いただけましたか？</p>
                          <p className="text-xs text-yellow-700">プレミアム版（300円）を購入すると、透かし（SAMPLE文字）が消え、高画質データをダウンロード可能になります。</p>
                        </div>

                        <button 
                          onClick={handleCheckout} 
                          disabled={isCheckoutLoading || isCheckingPayment} 
                          className="w-full bg-text-main text-white px-6 py-4 rounded-xl font-bold text-lg inline-flex justify-center items-center gap-2 hover:bg-gray-800 transition-all shadow-md group-hover:shadow-lg relative overflow-hidden disabled:opacity-50"
                        >
                          {isCheckoutLoading ? (
                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>移動中...</>
                          ) : (
                            <>
                              <Lock className="w-5 h-5 text-yellow-400" />
                              高画質版を購入して透かしを外す（¥300）
                              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <p className="text-sm font-bold text-green-700 flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> プレミアム権限 適用中</p>
                        <p className="text-xs text-green-600 mt-1">透かしなしの高画質データを無料でダウンロードできます。</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={handleDownloadSingle} 
                      className="w-full bg-white text-text-muted border border-border px-4 py-3 rounded-xl font-medium inline-flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors mt-2"
                    >
                      <Download className="w-4 h-4" /> {(isPremiumPaid || promoCode === '20230322') ? '高画質版をダウンロード (透かしなし)' : '無料版をダウンロード (透かしあり)'}
                    </button>

                    <button 
                      onClick={handleDownloadSheet} 
                      disabled={isGeneratingSheet} 
                      className="w-full mt-2 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-3 rounded-xl font-bold inline-flex justify-center items-center gap-2 hover:bg-blue-100 transition-colors"
                    >
                      <Printer className="w-5 h-5" /> {isGeneratingSheet ? '処理中...' : (isPremiumPaid || promoCode === '20230322') ? '印刷・切り取り用台紙をダウンロード (透かしなし)' : '印刷・切り取り用台紙をダウンロード (透かしあり)'}
                    </button>
                    
                    {/* Promotion Code Input */}
                    <div className="mt-4 p-4 border border-border rounded-xl bg-gray-50/50 flex flex-col gap-2">
                      <label htmlFor="promo" className="text-sm font-bold text-text-main flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-accent" /> プロモーションコード</label>
                      <div className="flex gap-2">
                        <input 
                          id="promo"
                          type="text" 
                          placeholder="コードを入力..." 
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-grow border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-mono"
                        />
                      </div>
                      {promoCode === '20230322' && (
                        <p className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> コード適用中：透かしなしでダウンロードできます</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Settings Panel */}
                <div className="w-full lg:w-[40%] bg-white rounded-[24px] shadow-sm border border-border p-6 md:p-8 sticky top-20">
                  <h3 className="font-bold text-lg flex items-center gap-2 mb-6 pb-4 border-b border-border">
                    <Settings2 className="w-5 h-5" /> 補正オプション
                  </h3>
                  
                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-3">背景カラー</label>
                      <div className="flex gap-3">
                        {[
                          { id: 'white', label: '白', color: '#ffffff', b: '#e5e5e5' },
                          { id: 'blue', label: '青', color: '#eff6ff', b: '#bfdbfe' },
                          { id: 'gray', label: 'グレー', color: '#f3f4f6', b: '#e5e7eb' }
                        ].map(bg => (
                          <button
                            key={bg.id}
                            onClick={() => setBgColor(bg.id as 'white' | 'blue' | 'gray')}
                            className={`flex flex-col items-center justify-center py-4 border-2 rounded-xl text-sm transition-all flex-1 ${bgColor === bg.id ? 'border-accent bg-accent-light text-accent font-bold ring-2 ring-accent/20' : 'border-border text-text-muted hover:border-gray-300'}`}
                          >
                            <span className="w-6 h-6 rounded-full border border-black/10 shadow-inner mb-2" style={{ backgroundColor: bg.color }}></span>
                            {bg.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-text-main mb-3">画像編集（明るさ・色調）</label>
                      <div className="space-y-5 bg-gray-50 p-5 rounded-xl border border-border">
                        <div>
                          <div className="flex justify-between text-sm font-bold text-text-main mb-2">
                            <span>明るさ</span>
                            <span className="text-accent">{brightness}%</span>
                          </div>
                          <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm font-bold text-text-main mb-2">
                            <span>コントラスト</span>
                            <span className="text-accent">{contrast}%</span>
                          </div>
                          <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-text-main mb-3">証明写真のサイズ</label>
                      <select 
                        value={sizePresetId}
                        onChange={(e) => setSizePresetId(e.target.value)}
                        className="w-full border-2 border-border rounded-xl px-4 py-4 text-base font-medium focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
                      >
                        {PHOTO_SIZE_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>{p.label} — {p.width}x{p.height}mm</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-2">
                      <button onClick={(e) => handleConvert(e)} disabled={isConverting} className="w-full py-4 bg-gray-100 text-text-main border border-transparent rounded-xl font-bold hover:bg-gray-200 transition-colors flex justify-center items-center gap-2">
                        {isConverting ? <><div className="w-5 h-5 border-2 border-gray-400 border-t-text-main rounded-full animate-spin"></div>更新中...</> : '設定を反映して再生成'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Print Sheet Preview */}
              {generatedSheet && (
                <div className="mt-16 p-8 md:p-12 border border-border rounded-3xl bg-white shadow-sm flex flex-col items-center" id="generated-sheet">
                  <h3 className="font-extrabold text-2xl mb-2 text-center text-text-main">
                    印刷用台紙（L判サイズ）
                  </h3>
                  <p className="text-text-muted mb-8 text-center max-w-lg">
                    お近くのセブンイレブン等のマルチコピー機で「L判写真プリント（89x127mm）」として印刷し、点線に沿って切り取ってください。
                  </p>
                  
                  <div 
                    className="relative w-full max-w-[400px] aspect-[89/127] shadow-xl border border-gray-200 mb-8 rounded bg-white overflow-hidden pointer-events-none transition-all duration-200"
                    style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                  >
                    <Image src={generatedSheet} alt="Print Sheet" fill className="object-cover" />
                  </div>
                  
                  <button onClick={handleDownloadSheet} disabled={isGeneratingSheet} className="bg-text-main text-white px-8 py-4 rounded-xl font-bold text-lg inline-flex items-center gap-2 hover:bg-gray-800 transition-all shadow-md mt-4">
                    <Download className="w-5 h-5" /> {isGeneratingSheet ? '処理中...' : (isPremiumPaid || promoCode === '20230322') ? '台紙画像（透かしなし）を保存' : '台紙画像（透かしあり）を保存'}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* === FEATURE BENTO GRID SECTION === */}
        <section className="w-full px-6 py-28 max-w-6xl mx-auto bg-gray-50/30">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight text-text-main">機能のすべてを、カンタンに。</h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              複雑な画像編集ソフトや高価なカメラは不要です。<br/>すべてブラウザ上で完結するパワフルな機能群。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[220px]">
            
            {/* Feature 1 (Large Card - High Priority) */}
            <div className="md:col-span-2 lg:col-span-2 row-span-2 bg-white rounded-[24px] shadow-sm border border-border p-8 md:p-10 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <Briefcase className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-2xl mb-4 text-text-main">AI自動スーツ着用機能</h3>
                <p className="text-text-muted text-lg leading-relaxed max-w-md">
                  私服で撮った写真も、AIが肩のラインに合わせて自然なビジネススーツ姿に変換。<br/>面接や就活用、資格用の写真も、自宅でいますぐ完璧に用意できます。
                </p>
              </div>
              <div className="absolute right-[-20%] bottom-[-10%] w-[60%] aspect-square bg-blue-50 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
            </div>

            {/* Feature 2 */}
            <div className="md:col-span-1 lg:col-span-2 bg-white rounded-[24px] shadow-sm border border-border p-8 flex flex-col justify-center hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex-shrink-0 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Scissors className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2 text-text-main">1ピクセルの背景透過</h3>
                  <p className="text-text-muted leading-relaxed">
                    部屋の中の複雑な背景も、AIが髪の毛1本レベルで正確に切り抜きます。
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="md:col-span-1 lg:col-span-1 bg-white rounded-[24px] shadow-sm border border-border p-8 flex flex-col items-center text-center justify-center hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-4 shadow-sm group-hover:rotate-12 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-text-main">背景色変更</h3>
              <p className="text-text-muted text-sm">白・青・グレーへ<br/>ワンタッチで変更。</p>
            </div>

            {/* Feature 4 */}
            <div className="md:col-span-1 lg:col-span-1 bg-white rounded-[24px] shadow-sm border border-border p-8 flex flex-col items-center text-center justify-center hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 text-green-600 flex items-center justify-center mb-4 shadow-sm group-hover:-rotate-12 transition-transform">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-text-main">L判コンビニ印刷</h3>
              <p className="text-text-muted text-sm">切り取り線付きの<br/>台紙を自動生成。</p>
            </div>

          </div>
        </section>

        {/* === FAQ SECTION === */}
        <section className="py-24 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 tracking-tight text-text-main">よくある質問</h2>
          </div>
          
          <div className="space-y-2">
            <FAQItem 
              question="どのような写真を用意すればいいですか？" 
              answer="できるだけ明るい場所で、顔に強い影が落ちていない正面向きの写真をスマホ等で撮影してアップロードしてください。背景に多少の生活感があってもAIが綺麗に透過します。"
            />
            <FAQItem 
              question="本当に無料で使えますか？" 
              answer="はい、画像のアップロードからAIによる背景透過、スーツ合成のプレビュー作成、および透かし（SAMPLE）入りの画像ダウンロードまでは何回でも無料でお試しいただけます。仕上がりに満足いただけた場合のみ、高画質（透かしなし）版をご購入ください。"
            />
            <FAQItem 
              question="印刷はどうすればいいですか？" 
              answer="「印刷用台紙を作成」ボタンから生成された画像をスマートフォン等に保存し、セブンイレブンやファミリーマート等のコンビニエンスストアにある「マルチコピー機」で『L判サイズの写真プリント（カラー）』として印刷してください。"
            />
            <FAQItem 
              question="アップロードした写真のプライバシーは安全ですか？" 
              answer="セキュリティとプライバシーを最優先しています。アップロードされた画像はAIによる変換処理の目的にのみ一時的に使用され、変換完了後にサーバーから速やかに安全に削除されます。"
            />
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-white py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-text-main text-white flex items-center justify-center">
              <Camera className="w-3 h-3" />
            </div>
            <span className="font-bold tracking-tight text-text-main">ID Photo Studio</span>
          </div>
          <div className="text-sm text-text-muted">
            &copy; 2026 ID Photo Studio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
