import { parse } from 'url';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: any, res: any) {
  try {
    const { code } = parse(req.url, true).query;

    if (!code) {
      throw new Error('No code provided');
    }

    // Exchange code for access token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.VITE_GITHUB_CLIENT_ID,
        client_secret: process.env.VITE_GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const data = await response.json();
    if (!data.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info
    const userInfoResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${data.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    // Get current user from Supabase
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (supabaseUser) {
      // Update or create profile with GitHub token
      await supabase
        .from('profiles')
        .upsert({
          id: supabaseUser.id,
          github_token: data.access_token,
          github_username: userInfo.login,
          updated_at: new Date().toISOString(),
        });

      // Redirect back to admin projects page
      res.writeHead(302, {
        Location: '/admin/projects',
      });
      res.end();
    } else {
      throw new Error('No user found in Supabase');
    }
  } catch (error) {
    console.error('GitHub callback error:', error);
    res.writeHead(302, {
      Location: '/login',
    });
    res.end();
  }
}
