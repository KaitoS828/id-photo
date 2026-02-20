'use client';

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import {
  ConvertResponse,
  BackgroundColor,
  RetouchSettings,
  DEFAULT_RETOUCH,
  PHOTO_SIZE_PRESETS,
  BACKGROUND_COLORS,
} from '@/types';
import { generatePhotoSheet } from '@/utils/generateSheet';
import { applyRetouchToImage, buildFilterString } from '@/utils/applyRetouch';
import RetouchControls from '@/components/RetouchControls';

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColor>('white');
  const [sizePreset, setSizePreset] = useState<string>('passport');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);
  const [retouchSettings, setRetouchSettings] = useState<RetouchSettings>({ ...DEFAULT_RETOUCH });

  const selectedSize = PHOTO_SIZE_PRESETS.find((s) => s.id === sizePreset);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください');
      return;
    }
    setError(null);
    setConvertedImage(null);
    setFileName(file.name);
    setUploadedMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleConvert = useCallback(async () => {
    if (!uploadedImage) return;

    setIsConverting(true);
    setError(null);
    setConvertedImage(null);

    try {
      const base64Data = uploadedImage.split(',')[1];

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: uploadedMimeType,
          backgroundColor,
          sizePreset,
        }),
      });

      const data: ConvertResponse = await response.json();

      if (data.success && data.imageBase64 && data.mimeType) {
        setConvertedImage(`data:${data.mimeType};base64,${data.imageBase64}`);
      } else {
        setError(data.error || '変換に失敗しました');
      }
    } catch {
      setError('通信エラーが発生しました。再度お試しください。');
    } finally {
      setIsConverting(false);
    }
  }, [uploadedImage, uploadedMimeType, backgroundColor, sizePreset]);

  const handleDownloadImage = useCallback(async () => {
    if (!convertedImage) return;
    try {
      const finalImage = await applyRetouchToImage(convertedImage, retouchSettings);
      const link = document.createElement('a');
      link.href = finalImage;
      link.download = `証明写真_${selectedSize?.label || 'photo'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('ダウンロードエラー:', err);
      setError('画像のダウンロードに失敗しました');
    }
  }, [convertedImage, selectedSize, retouchSettings]);

  const handleDownloadSheet = useCallback(async () => {
    if (!convertedImage) return;
    setIsGeneratingSheet(true);
    try {
      // レタッチを適用した画像で台紙を生成
      const retouchedImage = await applyRetouchToImage(convertedImage, retouchSettings);
      const sheetDataUrl = await generatePhotoSheet(retouchedImage, sizePreset);
      const link = document.createElement('a');
      link.href = sheetDataUrl;
      link.download = `証明写真_台紙_${selectedSize?.label || 'photo'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('台紙生成エラー:', err);
      setError('台紙の生成に失敗しました');
    } finally {
      setIsGeneratingSheet(false);
    }
  }, [convertedImage, sizePreset, selectedSize, retouchSettings]);

  const handleReset = useCallback(() => {
    setUploadedImage(null);
    setUploadedMimeType('');
    setFileName('');
    setConvertedImage(null);
    setError(null);
    setRetouchSettings({ ...DEFAULT_RETOUCH });
  }, []);

  return (
    <main className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <svg className="logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span className="logo-text">ID Photo Studio</span>
          </div>
          <p className="header-desc">証明写真をかんたん作成</p>
        </div>
      </header>

      <div className="container">
        <div className="layout">
          {/* Left Column: Controls */}
          <div className="controls-column">
            {/* Upload */}
            <section className="section" aria-labelledby="section-upload">
              <h2 id="section-upload" className="section-title">
                <span className="section-number">1</span>
                写真を選択
              </h2>
              <div
                id="upload-dropzone"
                className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${uploadedImage ? 'dropzone-has-image' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input')?.click()}
                role="button"
                tabIndex={0}
                aria-label="写真をアップロード"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.getElementById('file-input')?.click();
                  }
                }}
              >
                {uploadedImage ? (
                  <div className="preview-container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedImage} alt="アップロードされた写真" className="preview-image" />
                    <div className="preview-overlay">
                      <button
                        className="change-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                        type="button"
                      >
                        写真を変更
                      </button>
                    </div>
                    <p className="file-name">{fileName}</p>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <div className="upload-icon" aria-hidden="true">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="dropzone-text">
                      ドラッグ&ドロップ または <span className="text-link">ファイルを選択</span>
                    </p>
                    <p className="dropzone-hint">JPG, PNG, WebP（最大10MB）</p>
                  </div>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileInput}
                  className="sr-only"
                  aria-label="画像ファイルを選択"
                />
              </div>
            </section>

            {/* Options */}
            <section className="section" aria-labelledby="section-options">
              <h2 id="section-options" className="section-title">
                <span className="section-number">2</span>
                オプション設定
              </h2>

              <div className="option-group">
                <label className="option-label" id="bg-label">背景色</label>
                <div className="color-options" role="radiogroup" aria-labelledby="bg-label">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color.id}
                      id={`bg-color-${color.id}`}
                      className={`color-btn ${backgroundColor === color.id ? 'color-btn-active' : ''}`}
                      onClick={() => setBackgroundColor(color.id)}
                      role="radio"
                      aria-checked={backgroundColor === color.id}
                      type="button"
                    >
                      <span
                        className="color-swatch"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden="true"
                      />
                      <span>{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <label className="option-label" id="size-label">写真サイズ</label>
                <div className="size-options" role="radiogroup" aria-labelledby="size-label">
                  {PHOTO_SIZE_PRESETS.map((size) => (
                    <button
                      key={size.id}
                      id={`size-${size.id}`}
                      className={`size-btn ${sizePreset === size.id ? 'size-btn-active' : ''}`}
                      onClick={() => setSizePreset(size.id)}
                      role="radio"
                      aria-checked={sizePreset === size.id}
                      type="button"
                    >
                      <span className="size-label">{size.label}</span>
                      <span className="size-desc">{size.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Convert Button */}
            <button
              id="convert-button"
              className="convert-btn"
              disabled={!uploadedImage || isConverting}
              onClick={handleConvert}
              type="button"
            >
              {isConverting ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  変換中...
                </>
              ) : (
                '証明写真を作成'
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="error-message" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="result-column">
            {convertedImage ? (
              <section className="section result-section" aria-labelledby="section-result">
                <h2 id="section-result" className="section-title">
                  <span className="section-number section-number-done">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  完成プレビュー
                </h2>
                <div className="result-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={convertedImage}
                    alt="変換後の証明写真"
                    className="result-image"
                    style={{ filter: buildFilterString(retouchSettings) }}
                  />
                </div>
                <RetouchControls
                  settings={retouchSettings}
                  onChange={setRetouchSettings}
                />
                <div className="result-info">
                  <span className="result-badge">{selectedSize?.label}</span>
                  <span className="result-size">{selectedSize?.description}</span>
                </div>
                <div className="download-actions">
                  <button
                    id="download-image-button"
                    className="download-btn download-btn-primary"
                    onClick={handleDownloadImage}
                    type="button"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    画像をダウンロード
                  </button>
                  <button
                    id="download-sheet-button"
                    className="download-btn download-btn-secondary"
                    onClick={handleDownloadSheet}
                    disabled={isGeneratingSheet}
                    type="button"
                  >
                    {isGeneratingSheet ? (
                      <>
                        <span className="spinner spinner-small" aria-hidden="true" />
                        台紙を生成中...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                        </svg>
                        台紙をダウンロード
                      </>
                    )}
                  </button>
                </div>
                <p className="sheet-hint">※ 台紙はL判サイズに印刷できます</p>
              </section>
            ) : (
              <div className="result-placeholder">
                <div className="placeholder-icon" aria-hidden="true">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
                <p className="placeholder-text">変換結果がここに表示されます</p>
                <p className="placeholder-hint">写真をアップロードして「証明写真を作成」を押してください</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>ID Photo Studio — Powered by Nano Banana Pro</p>
      </footer>
    </main>
  );
}
