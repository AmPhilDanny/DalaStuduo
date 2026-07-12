import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';

interface Props {
  repoId: number;
  userId: string;
  isFeatured: boolean;
  onToggle: (featured: boolean) => void;
}

export default function FeaturedToggle({ repoId, userId, isFeatured, onToggle }: Props) {
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const newValue = !isFeatured;
      const { error } = await supabase
        .from('user_repos')
        .update({ is_featured: newValue })
        .eq('github_repo_id', repoId)
        .eq('user_id', userId);

      if (error) throw error;
      onToggle(newValue);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`p-1.5 rounded-lg transition-colors ${
        isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-500'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isFeatured ? 'Remove from featured' : 'Feature on profile'}
    >
      <Star className={`w-4 h-4 ${isFeatured ? 'fill-amber-500' : ''}`} />
    </button>
  );
}
