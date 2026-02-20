/** 証明写真の背景色 */
export type BackgroundColor = 'white' | 'blue' | 'gray';

/** 証明写真のサイズプリセット */
export interface PhotoSize {
  id: string;
  label: string;
  width: number; // mm
  height: number; // mm
  description: string;
}

/** API リクエスト型 */
export interface ConvertRequest {
  imageBase64: string;
  mimeType: string;
  backgroundColor: BackgroundColor;
  sizePreset: string;
}

/** API レスポンス型 */
export interface ConvertResponse {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
}

/** 証明写真サイズプリセット一覧 */
export const PHOTO_SIZE_PRESETS: PhotoSize[] = [
  {
    id: 'passport',
    label: 'パスポート',
    width: 35,
    height: 45,
    description: '35mm × 45mm',
  },
  {
    id: 'resume',
    label: '履歴書',
    width: 30,
    height: 40,
    description: '30mm × 40mm',
  },
  {
    id: 'mynumber',
    label: 'マイナンバーカード',
    width: 35,
    height: 45,
    description: '35mm × 45mm',
  },
  {
    id: 'driver',
    label: '運転免許証',
    width: 24,
    height: 30,
    description: '24mm × 30mm',
  },
  {
    id: 'visa',
    label: 'ビザ申請',
    width: 50,
    height: 50,
    description: '50mm × 50mm',
  },
];

/** 背景色の表示名と値 */
export const BACKGROUND_COLORS: { id: BackgroundColor; label: string; hex: string }[] = [
  { id: 'white', label: '白', hex: '#FFFFFF' },
  { id: 'blue', label: '青', hex: '#1A73E8' },
  { id: 'gray', label: 'グレー', hex: '#C0C0C0' },
];

/** レタッチ設定 */
export interface RetouchSettings {
  brightness: number; // 0-200, default 100
  contrast: number;   // 0-200, default 100
  saturate: number;   // 0-200, default 100
}

/** レタッチ設定のデフォルト値 */
export const DEFAULT_RETOUCH: RetouchSettings = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
};
