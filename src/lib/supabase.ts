import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          title: string;
          description: string;
          technologies: string[];
          github_url: string;
          live_url: string;
          thumbnail_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          technologies: string[];
          github_url: string;
          live_url?: string;
          thumbnail_url?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          technologies?: string[];
          github_url?: string;
          live_url?: string;
          thumbnail_url?: string;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          content: string;
          excerpt: string;
          thumbnail_url: string;
          published_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          excerpt: string;
          thumbnail_url?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          excerpt?: string;
          thumbnail_url?: string;
        };
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          message: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          message?: string;
        };
      };
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);