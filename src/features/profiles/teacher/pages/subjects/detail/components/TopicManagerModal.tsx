import { useEffect, useState } from "react";
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
        className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${panelBg} ${panelBorder}`}
      >
        <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${panelBorder}`}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ backgroundColor: ACCENT }}>
              <Tag size={16} />
            </span>
            <div>
              <h2 className={`text-sm font-extrabold ${textPrimary}`}>Manage Topics</h2>
              <p className={`text-[11px] font-semibold ${textMuted}`}>Group assessments by what they cover</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#64748B] hover:bg-[#F6F7FB]"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {/* Add topic row */}
          <div className="flex gap-2">
            <input
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="e.g. Fractions, Photosynthesis"
              className={`h-10 flex-1 rounded-xl border px-3 text-xs font-bold outline-none transition focus:ring-2 ${panelBg} ${panelBorder} ${textPrimary}`}
              style={{ "--tw-ring-color": `${ACCENT}55` } as React.CSSProperties}
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newTopicName.trim()}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 text-xs font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: ACCENT }}
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}

          {/* Topic list */}
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {loading ? (
              <p className={`py-6 text-center text-xs font-semibold ${textMuted}`}>Loading topics...</p>
            ) : topics.length === 0 ? (
              <p className={`py-6 text-center text-xs font-semibold ${textMuted}`}>
                No topics yet. Add one above — you'll be able to tag assessments to it next.
              </p>
            ) : (
              topics.map((topic) => (
                <div
                  key={topic.id}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${panelBorder}`}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: darkMode ? `${ACCENT}25` : "#F8EDEE", color: ACCENT }}
                  >
                    <Tag size={13} />
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