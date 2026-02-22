import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 未使用のアンロックを1つ取得
    const { data: unlock, error: fetchError } = await supabase
      .from('unlocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('used', false)
      .limit(1)
      .single()

    if (fetchError || !unlock) {
      return NextResponse.json(
        { error: '利用可能なチケット（アンロック枠）がありません' },
        { status: 402 } // Payment Required
      )
    }

    // そのアンロックを「使用済み」にする
    const { error: updateError } = await supabase
      .from('unlocks')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', unlock.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, message: 'Ticket consumed successfully' })
  } catch (error: unknown) {
    console.error('[API] POST /api/unlock error:', error)
    return NextResponse.json(
      { error: 'Failed to consume unlock ticket', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
