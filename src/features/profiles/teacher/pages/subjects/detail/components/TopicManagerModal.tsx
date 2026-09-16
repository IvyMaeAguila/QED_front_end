import { useEffect, useState, type CSSProperties } from "react";
import { Plus, Tag, X } from "lucide-react";
import { createTopic, fetchTopics, type Topic } from "../../services/subjectGrading.service";

const ACCENT = "#6B0000";

interface TopicManagerModalProps {
  subjectSectionId: string;
  onClose: () => void;
  onTopicsChanged: (topics: Topic[]) => void;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textMuted: string;
}

export function TopicManagerModal({
  subjectSectionId,
  onClose,
  onTopicsChanged,
  darkMode,
  panelBg,
  panelBorder,
  textMuted,
}: TopicManagerModalProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicName, setNewTopicName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textPrimary = darkMode ? "text-white" : "text-[#111827]";

  useEffect(() => {
    fetchTopics(subjectSectionId)
      .then((data) => {
        setTopics(data);
        onTopicsChanged(data);
      })
      .catch((err) => {
        console.error("Failed to load topics:", err);
        setError("Failed to load topics.");
      })
      .finally(() => setLoading(false));
  }, [subjectSectionId]);

  async function handleAdd() {
    const name = newTopicName.trim();
    if (!name) return;

    setSaving(true);
    setError(null);
    try {
      await createTopic(subjectSectionId, name);
      const updated = await fetchTopics(subjectSectionId);
      setTopics(updated);
      onTopicsChanged(updated);
      setNewTopicName("");
    } catch (err) {
      console.error("Failed to create topic:", err);
      setError(err instanceof Error ? err.message : "Failed to create topic.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,10,15,0.56)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`}
      >
        <div className={`flex items-center justify-between gap-3 border-b px-4 py-2.5 ${panelBorder}`}>
          <div className="flex min-w-0 items-center gap-2">
            <Tag size={13} style={{ color: ACCENT }} />
            <div className="min-w-0">
              <p className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>Manage Topics</p>
              <p className={`truncate text-[11px] font-medium ${textMuted}`}>
                Group assessments by what they cover
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
              darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#64748B] hover:bg-black/5"
            }`}
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4">
          {/* Add topic row */}
          <div className="flex gap-2">
            <input
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="e.g. Fractions, Photosynthesis"
              className={`h-8 flex-1 rounded-lg border px-3 text-[11px] font-bold outline-none transition focus:ring-2 ${panelBg} ${panelBorder} ${textPrimary}`}
              style={{ "--tw-ring-color": `${ACCENT}55` } as CSSProperties}
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newTopicName.trim()}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#800000] px-3 text-[11px] font-extrabold text-white transition-colors hover:bg-[#650000] disabled:opacity-40"
            >
              <Plus size={12} />
              Add
            </button>
          </div>

          {error && <p className="mt-2 text-[11px] font-bold text-[#DC2626]">{error}</p>}

          {/* Topic list */}
          <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
            {loading ? (
              <p className={`py-6 text-center text-[11px] font-medium ${textMuted}`}>Loading topics...</p>
            ) : topics.length === 0 ? (
              <p className={`py-6 text-center text-[11px] font-medium ${textMuted}`}>
                No topics yet. Add one above — you'll be able to tag assessments to it next.
              </p>
            ) : (
              topics.map((topic) => (
                <div
                  key={topic.id}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${panelBorder}`}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: darkMode ? `${ACCENT}25` : "#F8EDEE", color: ACCENT }}
                  >
                    <Tag size={12} />
                  </span>
                  <span className={`text-xs font-bold ${textPrimary}`}>{topic.topicName}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}