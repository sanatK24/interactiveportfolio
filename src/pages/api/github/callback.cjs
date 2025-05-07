const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');

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
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      throw new Error('No user found in Supabase');
    }

    // Update or create profile with GitHub token
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        { 
          id: supabaseUser.id, 
          github_token: data.access_token, 
          github_username: userInfo.login,
          updated_at: new Date().toISOString() 
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    // Redirect back to admin projects page
    res.writeHead(302, {
      Location: '/admin/projects',
    });
    res.end();
  } catch (error) {
    console.error('GitHub callback error:', error);
    res.writeHead(302, {
      Location: '/login',
    });
    res.end();
  }
};
