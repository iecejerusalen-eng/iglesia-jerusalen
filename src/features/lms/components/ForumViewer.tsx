import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { MessageSquare, Pin, UserCircle, ChevronRight, CornerDownRight } from 'lucide-react';
import { toast } from 'sonner';

interface ForumAuthor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface Forum {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  is_locked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  author?: ForumAuthor;
}

interface ForumPost {
  id: string;
  forum_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: ForumAuthor;
  replies?: ForumPost[];
}

export function ForumViewer({ courseId }: { courseId: string }) {
  const { user } = useAuthStore();
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeForum, setActiveForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');

  const fetchForums = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lms_forums')
        .select(`*, author:created_by(id, first_name, last_name, avatar_url)`)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForums(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    const init = async () => {
      if (courseId) {
        await fetchForums();
      }
    };
    init();
  }, [courseId, fetchForums]);

  const fetchPosts = async (forumId: string) => {
    try {
      const { data, error } = await supabase
        .from('lms_forum_posts')
        .select(`*, author:author_id(id, first_name, last_name, avatar_url)`)
        .eq('forum_id', forumId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Organizar respuestas (anidadas nivel 1 para simplificar)
      const rootPosts = data.filter(p => !p.parent_id);
      const replies = data.filter(p => p.parent_id);
      
      const structured = rootPosts.map(root => ({
        ...root,
        replies: replies.filter(r => r.parent_id === root.id)
      }));

      setPosts(structured);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenForum = (forum: Forum) => {
    setActiveForum(forum);
    fetchPosts(forum.id);
  };

  const handlePost = async (parentId: string | null = null) => {
    if (!newPostContent.trim()) return;
    if (!user) return;
    if (!activeForum) return;
    
    try {
      const { error } = await supabase
        .from('lms_forum_posts')
        .insert({
          forum_id: activeForum.id,
          author_id: user.id,
          content: newPostContent,
          parent_id: parentId
        });

      if (error) throw error;
      toast.success('Publicado con éxito');
      setNewPostContent('');
      fetchPosts(activeForum.id);

      // (Gamification) Añadir 5 XP por participar
      await supabase.rpc('increment_xp', {
        p_course_id: courseId,
        p_user_id: user.id,
        amount: 5
      });

    } catch (err) {
      console.error(err);
      toast.error('Error al publicar');
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-100 dark:bg-slate-800 rounded-2xl"></div>;
  }

  if (activeForum) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/10">
          <button 
            onClick={() => setActiveForum(null)}
            className="text-sm font-bold text-gray-500 hover:text-gold flex items-center gap-1 mb-4"
          >
            <ChevronRight className="rotate-180" size={16} /> Volver a foros
          </button>
          <h2 className="text-2xl font-bold font-serif">{activeForum.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{activeForum.description}</p>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-slate-950/50">
          <div className="space-y-6">
            {posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <img src={post.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.id}`} alt="" className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-white">{post.author?.first_name} {post.author?.last_name}</p>
                    <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-slate-700 dark:text-gray-300 text-sm pl-13">
                  {post.content}
                </div>

                {/* Replies */}
                {post.replies && post.replies.length > 0 && (
                  <div className="mt-4 ml-8 space-y-3 border-l-2 border-indigo-100 dark:border-indigo-900/50 pl-4">
                    {post.replies.map((reply: ForumPost) => (
                      <div key={reply.id} className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <CornerDownRight size={14} className="text-gray-400" />
                          <p className="font-bold text-xs text-slate-800 dark:text-white">{reply.author?.first_name} {reply.author?.last_name}</p>
                          <span className="text-[10px] text-gray-400">{new Date(reply.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-gray-300 ml-5">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/10">
            <h4 className="font-bold text-sm mb-3">Escribir respuesta...</h4>
            <textarea 
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl p-3 outline-none focus:border-gold text-sm resize-none"
              rows={3}
              placeholder="Comparte tu punto de vista..."
            ></textarea>
            <div className="flex justify-end mt-2">
              <button 
                onClick={() => handlePost(null)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-150 dark:border-white/10 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <MessageSquare className="text-indigo-500" /> Foros de Debate
        </h2>
      </div>

      <div className="space-y-4">
        {forums.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p>No hay hilos de debate abiertos en este curso.</p>
          </div>
        ) : (
          forums.map(forum => (
            <div 
              key={forum.id} 
              onClick={() => handleOpenForum(forum)}
              className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md cursor-pointer transition-all bg-gray-50/50 dark:bg-slate-800/20"
            >
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
                {forum.is_locked ? <Pin size={24} /> : <MessageSquare size={24} />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{forum.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-1">{forum.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><UserCircle size={14}/> Creado por {forum.author?.first_name} {forum.author?.last_name}</span>
                  <span>{new Date(forum.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <ChevronRight className="text-gray-300 self-center" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
