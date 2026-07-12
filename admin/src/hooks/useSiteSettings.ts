import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteConfig {
  brand: {
    site_name: string;
    tagline: string;
    logo_url: string;
    favicon_url: string;
  };
  hero: {
    badge: string;
    title: string;
    title_highlight: string;
    subtitle: string;
    hero_image_url: string;
    primary_cta_text: string;
    primary_cta_action: string;
    secondary_cta_text: string;
    secondary_cta_action: string;
  };
  nav: {
    links: { name: string; href: string }[];
  };
  footer: {
    description: string;
    columns: { title: string; links: { name: string; href: string }[] }[];
    newsletter_enabled: boolean;
    newsletter_placeholder: string;
    copyright_text: string;
  };
  social: {
    twitter: string;
    linkedin: string;
    github: string;
    facebook: string;
    instagram: string;
  };
  meta: {
    title: string;
    description: string;
    keywords: string;
    author: string;
    og_image_url: string;
    theme_color: string;
  };
  api_keys: Record<string, { api_key: string; enabled: boolean }>;
}

const DEFAULT_CONFIG: SiteConfig = {
  brand: {
    site_name: 'SkillBridge Africa',
    tagline: 'Empowering the next generation of African tech talent',
    logo_url: '',
    favicon_url: '',
  },
  hero: {
    badge: 'Empowering Africa\'s Tech Future',
    title: 'Bridging the Gap to Your ',
    title_highlight: 'Tech Career',
    subtitle:
      'SkillBridge Africa provides the intensive training, industry-recognized skills, and mentorship you need to land your dream job in the global tech economy.',
    hero_image_url:
      'https://storage.googleapis.com/dala-prod-public-storage/generated-images/7906a63a-02a9-4967-a8cf-69c79663b9f3/tech-classroom-africa-9fb85669-1782681819989.webp',
    primary_cta_text: 'Browse Programs',
    primary_cta_action: '#programs',
    secondary_cta_text: 'Our Mission',
    secondary_cta_action: '#mission',
  },
  nav: {
    links: [
      { name: 'Marketplace', href: '/marketplace' },
      { name: 'Talent', href: '/talent' },
      { name: 'Projects', href: '/projects' },
      { name: 'Jobs', href: '/jobs' },
      { name: 'Tutor', href: '/tutor' },
      { name: 'Programs', href: '/#programs' },
    ],
  },
  footer: {
    description:
      'Empowering the next generation of African tech talent through intensive bridging programs and mentorship.',
    columns: [
      {
        title: 'Programs',
        links: [
          { name: 'Web Development', href: '#' },
          { name: 'Data Science', href: '#' },
          { name: 'UI/UX Design', href: '#' },
          { name: 'Cloud Computing', href: '#' },
        ],
      },
      {
        title: 'Community',
        links: [
          { name: 'Mentorship', href: '#' },
          { name: 'Events', href: '#' },
          { name: 'Success Stories', href: '#' },
          { name: 'Partner With Us', href: '#' },
        ],
      },
    ],
    newsletter_enabled: true,
    newsletter_placeholder: 'Email address',
    copyright_text: '\u00A9 {year} SkillBridge Africa. All rights reserved.',
  },
  social: {
    twitter: '#',
    linkedin: '#',
    github: '#',
    facebook: '#',
    instagram: '#',
  },
  meta: {
    title: 'Gebeya Dala',
    description: 'Gebeya Dala Generated Project',
    keywords: 'Gebeya Dala, AI, web development, generated project, React, Vite, Nextjs',
    author: 'Gebeya Dala',
    og_image_url: '/gebeya.webp',
    theme_color: '#ffffff',
  },
  api_keys: {},
};

export function useSiteSettings() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchConfig() {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'site_config')
          .maybeSingle();

        if (error) throw error;
        if (data?.value && !cancelled) {
          // Deep merge with defaults so any missing fields fall back to defaults
          setConfig(mergeDeep(structuredClone(DEFAULT_CONFIG), data.value as Partial<SiteConfig>));
        }
      } catch {
        // Silently fall back to defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchConfig();
    return () => { cancelled = true; };
  }, []);

  return { config, loading };
}

// Simple deep merge utility
function mergeDeep(target: SiteConfig, source: Partial<SiteConfig>): SiteConfig {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof SiteConfig)[]) {
    const val = source[key];
    if (val !== undefined && typeof val === 'object' && !Array.isArray(val)) {
      (result as Record<string, unknown>)[key] = { ...(target[key] as Record<string, unknown>), ...val };
    } else if (val !== undefined) {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}
