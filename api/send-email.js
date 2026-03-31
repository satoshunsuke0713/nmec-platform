const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

const resend = new Resend('re_67eeJL46_23DBvMd6wK96WJdKwgCZm5Pk');
const supabase = createClient(
  'https://cadindivyghcjlbetsoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZGluZGl2eWdoY2psYmV0c29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgxODMwNCwiZXhwIjoyMDkwMzk0MzA0fQ.fUiH17CsAs35FTnFU1FpsDXMUuvIhTH7xIT2DVBf7TI'
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, title, body, eventDate, location, committee, emailMode } = req.body;

  try {
    let query = supabase.from('users').select('email, name').eq('is_active', true).neq('email', 'info@nmec.jp');
    if (emailMode === 'directors') {
      query = query.lte('sort_order', 6);
    } else {
      query = query.lt('sort_order', 90);
    }
    const { data: users, error } = await query;
    if (error) throw error;

    const emails = users.map(function(u) { return u.email; }).filter(Boolean);
    if (emails.length === 0) return res.status(200).json({ success: true, sent: 0 });

    let subject = '', html = '';

    if (type === 'event') {
      subject = '【N-MEC】' + title + ' が登録されました';
      html = '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
        + '<div style="background:#CC0000;padding:24px;text-align:center">'
        + '<div style="display:inline-block;background:#fff;padding:8px 16px">'
        + '<span style="font-size:24px;font-weight:900;color:#CC0000">N</span>'
        + '<span style="font-size:14px;font-weight:900;color:#CC0000">MEC</span>'
        + '</div></div>'
        + '<div style="padding:32px 24px;background:#fff">'
        + '<h2 style="color:#CC0000;margin-bottom:16px">会議・事業のお知らせ</h2>'
        + '<h3 style="font-size:20px;color:#333;margin-bottom:24px">' + title + '</h3>'
        + '<table style="width:100%;border-collapse:collapse">'
        + (eventDate ? '<tr><td style="padding:8px 0;color:#666;width:80px">📅 日時</td><td style="padding:8px 0;font-weight:700">' + eventDate + '</td></tr>' : '')
        + (location ? '<tr><td style="padding:8px 0;color:#666">📍 場所</td><td style="padding:8px 0;font-weight:700">' + location + '</td></tr>' : '')
        + (committee ? '<tr><td style="padding:8px 0;color:#666">🏛️ 委員会</td><td style="padding:8px 0;font-weight:700">' + committee + '</td></tr>' : '')
        + '</table>'
        + '<div style="margin-top:32px;padding:16px;background:#f5f5f5;border-radius:4px">'
        + '<p style="margin:0;font-size:14px;color:#666">詳細・出欠回答はこちらから</p>'
        + '<a href="https://nmec-platform.vercel.app" style="display:inline-block;margin-top:12px;background:#CC0000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700;border-radius:2px">N-MECプラットフォームを開く</a>'
        + '</div></div>'
        + '<div style="padding:16px;background:#1a1a1a;text-align:center">'
        + '<p style="color:#999;font-size:12px;margin:0">新潟市異業種交流研究会協同組合</p>'
        + '</div></div>';
    } else if (type === 'notice') {
      subject = '【N-MEC】' + title;
      html = '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
        + '<div style="background:#CC0000;padding:24px;text-align:center">'
        + '<div style="display:inline-block;background:#fff;padding:8px 16px">'
        + '<span style="font-size:24px;font-weight:900;color:#CC0000">N</span>'
        + '<span style="font-size:14px;font-weight:900;color:#CC0000">MEC</span>'
        + '</div></div>'
        + '<div style="padding:32px 24px;background:#fff">'
        + '<h2 style="color:#CC0000;margin-bottom:16px">お知らせ</h2>'
        + '<h3 style="font-size:20px;color:#333;margin-bottom:24px">' + title + '</h3>'
        + '<div style="font-size:15px;color:#333;line-height:1.8;white-space:pre-line">' + (body||'') + '</div>'
        + '<div style="margin-top:32px;padding:16px;background:#f5f5f5;border-radius:4px">'
        + '<a href="https://nmec-platform.vercel.app" style="display:inline-block;background:#CC0000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700;border-radius:2px">N-MECプラットフォームを開く</a>'
        + '</div></div>'
        + '<div style="padding:16px;background:#1a1a1a;text-align:center">'
        + '<p style="color:#999;font-size:12px;margin:0">新潟市異業種交流研究会協同組合</p>'
        + '</div></div>';
    }

    // 50件ずつ送信
    for (var i = 0; i < emails.length; i += 50) {
      var chunk = emails.slice(i, i + 50);
      await resend.emails.send({
        from: 'N-MEC事務局 <onboarding@resend.dev>',
        to: chunk,
        subject: subject,
        html: html
      });
    }

    return res.status(200).json({ success: true, sent: emails.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
