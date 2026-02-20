/**
 * レタッチ適用ユーティリティ
 * Canvas の ctx.filter を使い、レタッチ設定を画像に焼き込む
 */

import { RetouchSettings, DEFAULT_RETOUCH } from '@/types';

/**
 * レタッチ設定が変更されているか判定
 */
export function isRetouchApplied(settings: RetouchSettings): boolean {
  return (
    settings.brightness !== DEFAULT_RETOUCH.brightness ||
    settings.contrast !== DEFAULT_RETOUCH.contrast ||
    settings.saturate !== DEFAULT_RETOUCH.saturate
  );
}

/**
 * CSS filter 文字列を生成
 */
export function buildFilterString(settings: RetouchSettings): string {
  return `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturate}%)`;
}

/**
 * レタッチ設定を画像に適用して DataURL を返す
 *
 * @param imageDataUrl - 元画像の Data URL
 * @param settings - レタッチ設定
 * @returns レタッチ適用後の DataURL (PNG)
 */
export async function applyRetouchToImage(
  imageDataUrl: string,
  settings: RetouchSettings
): Promise<string> {
  // レタッチが未変更なら元画像をそのまま返す
  if (!isRetouchApplied(settings)) {
    return imageDataUrl;
  }

  const img = await loadImageElement(imageDataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D コンテキストを取得できません');
  }

  ctx.filter = buildFilterString(settings);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/png');
}

/**
 * 画像を非同期でロード
 */
function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
