import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import api from "@/services/api";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (roomData: any) => void;
  userCourse?: { id: string; title: string };
}

export const CreateRoomModal = ({ isOpen, onClose, onCreate, userCourse }: CreateRoomModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [creating, setCreating] = useState(false);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setName(""); setTopic(""); setDescription(""); setSelectedCategory(""); setSelectedLevel(""); setSelectedLesson("");
      // Fetch categories
      api.get("/levels").then(res => setCategories(res.data.data || [])).catch(() => {});
    }
  }, [isOpen]);

  // Fetch levels when category changes
  useEffect(() => {
    if (selectedCategory) {
      // In this app, levels are often linked to a course. 
      // If categories are courses, we fetch their levels.
      api.get(`/courses/${selectedCategory}/roadmap`).then(res => {
        setLevels(res.data.levels || res.data || []);
      }).catch(() => setLevels([]));
    } else {
      setLevels([]);
    }
    setSelectedLevel("");
  }, [selectedCategory]);

  // Fetch lessons when level changes
  useEffect(() => {
    if (selectedLevel) {
      const levelObj = levels.find(l => l._id === selectedLevel);
      setLessons(levelObj?.lessons || []);
    } else {
      setLessons([]);
    }
    setSelectedLesson("");
  }, [selectedLevel, levels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !topic.trim()) return;

    setCreating(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        topic: topic.trim(),
        maxParticipants,
        isPublic,
        tags,
        course: userCourse?.id,
        lesson: selectedLesson || undefined
      });
      // Reset form
      setName("");
      setDescription("");
      setTopic("");
      setMaxParticipants(10);
      setIsPublic(true);
      setTags([]);
      setTagInput("");
      setSelectedLesson("");
    } catch (err) {
      console.error("Failed to create room:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <GlassCard className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create Study Room</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Room Name */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., React Hooks Study Group"
                  required
                  maxLength={50}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Topic */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Topic *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., React, JavaScript, CSS"
                  required
                  maxLength={30}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

               {/* Cascading Selection */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                     Category / Course
                   </label>
                   <select
                     value={selectedCategory}
                     onChange={(e) => setSelectedCategory(e.target.value)}
                     className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-foreground focus:outline-none focus:border-primary transition-colors"
                   >
                     <option value="">Select Category</option>
                     {categories.map(c => (
                       <option key={c._id} value={c._id}>{c.title}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                     Level
                   </label>
                   <select
                     value={selectedLevel}
                     onChange={(e) => setSelectedLevel(e.target.value)}
                     disabled={!selectedCategory}
                     className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                   >
                     <option value="">Select Level</option>
                     {levels.map(l => (
                       <option key={l._id} value={l._id}>{l.title}</option>
                     ))}
                   </select>
                 </div>
               </div>

               <div>
                 <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                   Lesson (Optional)
                 </label>
                 <select
                   value={selectedLesson}
                   onChange={(e) => setSelectedLesson(e.target.value)}
                   disabled={!selectedLevel}
                   className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                 >
                   <option value="">No lesson attached</option>
                   {lessons.map(l => (
                     <option key={l._id} value={l._id}>{l.title}</option>
                   ))}
                 </select>
               </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will you study in this room?"
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Max Participants */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Max Participants
                </label>
                <input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Math.max(2, Math.min(50, parseInt(e.target.value) || 10)))}
                  min={2}
                  max={50}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Tags (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag..."
                    maxLength={15}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                    className="px-4 py-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Public/Private */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                />
                <label htmlFor="isPublic" className="text-sm">
                  Make this room public (visible to all students)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <GlassButton
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  type="submit"
                  variant="primary"
                  disabled={!name.trim() || !topic.trim() || creating}
                  className="flex-1"
                >
                  {creating ? "Creating..." : "Create Room"}
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
