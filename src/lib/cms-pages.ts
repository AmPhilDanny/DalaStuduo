import { supabase } from '@/integrations/supabase/client';

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export async function getPages(): Promise<CmsPage[]> {
  const { data, error } = await supabase
    .from('custom_pages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPage(slug: string): Promise<CmsPage | null> {
  const { data, error } = await supabase
    .from('custom_pages')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data;
}

export async function createPage(page: { title: string; slug: string; content: string; published: boolean }): Promise<CmsPage> {
  const { data, error } = await supabase
    .from('custom_pages')
    .insert(page)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePage(id: string, page: { title?: string; slug?: string; content?: string; published?: boolean }): Promise<CmsPage> {
  const { data, error } = await supabase
    .from('custom_pages')
    .update({ ...page, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePage(id: string): Promise<void> {
  const { error } = await supabase
    .from('custom_pages')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
