import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ConvertRequest, ConvertResponse, PHOTO_SIZE_PRESETS } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest): Promise<NextResponse<ConvertResponse>> {
  try {
    if (!GEMINI_API_KEY) {
      console.error('[API] POST /api/convert: GEMINI_API_KEY が設定されていません');
      return NextResponse.json(
        { success: false, error: 'サーバー設定エラー: API キーが未設定です' },
        { status: 500 }
      );
    }

    const body: ConvertRequest = await request.json();
    const { imageBase64, mimeType, backgroundColor, sizePreset } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { success: false, error: '画像データが不足しています' },
        { status: 400 }
      );
    }

    const sizeInfo = PHOTO_SIZE_PRESETS.find((s) => s.id === sizePreset);
    const sizeLabel = sizeInfo ? `${sizeInfo.width}mm × ${sizeInfo.height}mm (${sizeInfo.label})` : 'パスポートサイズ (35mm × 45mm)';

    const bgColorMap: Record<string, string> = {
      white: '純白 (#FFFFFF)',
      blue: '証明写真用の明るい青 (#1A73E8)',
      gray: '明るいグレー (#C0C0C0)',
    };
    const bgColorLabel = bgColorMap[backgroundColor] || bgColorMap['white'];

    const prompt = `この写真を証明写真（IDフォト）に変換してください。以下の要件に厳密に従ってください：

1. **背景**: 元の背景を完全に除去し、${bgColorLabel}の均一な背景に置き換えてください。
2. **服装**: 元の服装をフォーマルなビジネススーツに変更してください。
   - 黒、紺、またはダークグレーのスーツジャケットに変更
   - 白いワイシャツ（襟付き）を着用
   - ネクタイを着用（落ち着いた色味）
   - 自然な見た目で、元の体型に合ったサイズ感にしてください
3. **サイズ・構図**: ${sizeLabel}の証明写真の標準的な構図にしてください。
   - 顔が写真の中央上部に配置されるようにしてください
   - 頭頂部から写真上端まで適切な余白を確保してください
   - 肩から上が写るようにしてください
4. **品質**: 
   - 顔の特徴、肌の色、髪型を忠実に保持してください
   - 照明を均一に調整し、影を軽減してください
   - プロフェッショナルな証明写真の品質にしてください
5. **注意事項**:
   - 顔を変形・加工しないでください（元の顔の特徴をそのまま保持）
   - 写真は正面向きの最終形態にしてください`;

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['Image', 'Text'],
        imageConfig: {
          imageSize: '2K',
        },
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: '画像の変換に失敗しました。別の画像をお試しください。' },
        { status: 500 }
      );
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      return NextResponse.json(
        { success: false, error: '画像の変換に失敗しました。' },
        { status: 500 }
      );
    }

    for (const part of parts) {
      if (part.inlineData) {
        return NextResponse.json({
          success: true,
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        });
      }
    }

    // テキストのみ返ってきた場合
    const textPart = parts.find((p) => p.text);
    return NextResponse.json(
      {
        success: false,
        error: textPart?.text || '画像の生成に失敗しました。顔がはっきり写った写真を使用してください。',
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('[API] POST /api/convert error:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    return NextResponse.json(
      { success: false, error: `変換処理中にエラーが発生しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
