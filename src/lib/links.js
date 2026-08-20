import { supabase } from './supabase'

// Get (or create) my shareable invite code.
export async function getMyInviteCode() {
  const { data, error } = await supabase.rpc('my_invite_code')
  if (error) throw error
  return data
}

// Redeem another player's code -> I become their scout.
export async function redeemInvite(code) {
  const { data, error } = await supabase.rpc('redeem_invite', { invite_code: code })
  if (error) throw error
  return data // { ok, name?, player?, error? }
}

// List my links (both directions) with names.
export async function getMyLinks() {
  const { data, error } = await supabase.rpc('my_links')
  if (error) throw error
  return data || []
}
