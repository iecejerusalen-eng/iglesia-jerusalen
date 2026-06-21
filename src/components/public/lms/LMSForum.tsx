import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { MessageSquare, Send, User, Trash2 } from 'lucide-react';
import type { LMSForumPost, LMSActivity } from '../../../types';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';

interface Props {
  activity: LMSActivity;
  courseId: string;
}

const LMSForum = ({ activity }: Props) => {
  const { user, photoUrl } = useAuthStore();
  const [posts, setPosts] = useState<LMSForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchPosts();
    
    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`forum_${activity.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'lms_forum_posts',
        filter: `activity_id=eq.${activity.id}`
      }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activity.id]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('lms_forum_posts')
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            photo_url,
            role,
            roles
          )
        `)
        .eq('activity_id', activity.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Organize into threads (parents and children)
      const threads = data?.filter(p => !p.parent_id) || [];
      const replies = data?.filter(p => p.parent_id) || [];
      
      const structuredPosts = threads.map(t => ({
        ...t,
        replies: replies.filter(r => r.parent_id === t.id)
      }));

      setPosts(structuredPosts as any[]);
    } catch (err) {
      console.error('Error fetching forum posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (parentId: string | null = null) => {
    if (!user) {
      toast.error('Debes iniciar sesión para publicar');
      return;
    }

    const content = parentId ? replyContent : newPost;
    if (!content.trim()) return;

    try {
      const { error } = await supabase
        .from('lms_forum_posts')
        .insert([{
          activity_id: activity.id,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId
        }]);

      if (error) throw error;

      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewPost('');
      }
    } catch (err: any) {
      toast.error('Error al publicar: ' + err.message);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta publicación?')) return;
    
    try {
      const { error } = await supabase
        .from('lms_forum_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('Publicación eliminada');
    } catch (err: any) {
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  const renderPost = (post: LMSForumPost, isReply = false) => {
    const authorName = post.profiles ? `${post.profiles.first_name || ''} ${post.profiles.last_name || ''}`.trim() : 'Usuario Anónimo';
    const isAuthor = user?.id === post.user_id;

    return (
      <div key={post.id} className={`${isReply ? 'ml-8 mt-3 border-l-2 border-indigo-100 dark:border-indigo-900/30 pl-4' : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-4'}`}>
        <div className="flex items-start gap-3">
          {post.profiles?.photo_url ? (
            <img src={post.profiles.photo_url} alt={authorName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User size={16} />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{authorName}</span>
                {(() => {
                  const postRoles = post.profiles?.roles || (post.profiles?.role ? [post.profiles.role] : []);
                  const isInstructor = postRoles.some((r: any) => ['maestro', 'docente', 'pastor', 'admin'].includes(r));
                  return isInstructor ? (
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold">
                      Instructor
                    </span>
                  ) : null;
                })()}
                <span className="text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              {isAuthor && (
                <button onClick={() => handleDelete(post.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{post.content}</p>
            
            {!isReply && user && (
              <div className="mt-3 flex items-center gap-4">
                <button 
                  onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
                >
                  <MessageSquare size={12} />
                  Responder
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reply input field */}
        {replyingTo === post.id && (
          <div className="ml-11 mt-3 flex items-start gap-2">
            {photoUrl ? (
              <img src={photoUrl} alt="You" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <User size={12} className="text-gray-500" />
              </div>
            )}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Escribe una respuesta..."
                className="flex-1 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePostSubmit(post.id)}
              />
              <button 
                onClick={() => handlePostSubmit(post.id)}
                disabled={!replyContent.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 flex items-center justify-center transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {post.replies && post.replies.length > 0 && (
          <div className="mt-3">
            {post.replies.map((reply: any) => renderPost(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6">
      <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <MessageSquare size={18} className="text-amber-500" /> 
        Foro de Discusión
      </h4>

      {/* New Post Input */}
      {user ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-4 mb-6 shadow-sm flex items-start gap-3">
          {photoUrl ? (
            <img src={photoUrl} alt="You" className="w-10 h-10 rounded-full object-cover shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <User size={20} />
            </div>
          )}
          
          <div className="flex-1">
            <textarea
              placeholder="Comparte tu opinión, duda o comentario con la clase..."
              className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => handlePostSubmit(null)}
                disabled={!newPost.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm py-1.5 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <Send size={14} /> Publicar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Debes iniciar sesión para participar en este foro.
          </p>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Cargando discusiones...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <MessageSquare size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aún no hay mensajes.</p>
            <p className="text-xs text-gray-400 mt-1">¡Sé el primero en iniciar la discusión!</p>
          </div>
        ) : (
          posts.map(post => renderPost(post))
        )}
      </div>
    </div>
  );
};

export default LMSForum;
