import { useEffect, useState, type CSSProperties } from "react";
import { Plus, Tag } from "lucide-react";
import { ModalBody, ModalFrame, ModalHeader } from "@shared/components/modal";
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
    <ModalFrame shellVariant={darkMode ? "dark" : "standard"} onClose={onClose} size="md" zIndexClass="z-[1000]" ariaLabel="Manage Topics">
        <ModalHeader
          title="Manage Topics"
          subtitle="Group assessments by what they cover"
          titleClassName={textPrimary}
          subtitleClassName={textMuted}
          leading={<Tag size={16} style={{ color: ACCENT }} />}
          onClose={onClose}
          closeDarkMode={darkMode}
          className="items-center"
        />

        <ModalBody className="p-5">
          {/* Add topic row */}
          <div className="flex gap-2">
            <input
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="e.g. Fractions, Photosynthesis"
              className={`h-10 flex-1 rounded-lg border px-3 outline-none transition focus:ring-2 ${panelBg} ${panelBorder} ${textPrimary}`}
              style={{ "--tw-ring-color": `${ACCENT}55` } as CSSProperties}
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newTopicName.trim()}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#800000] px-4 qed-type-button text-white transition-colors hover:bg-[#650000] disabled:opacity-40"
            >
              <Plus size={12} />
              Add
            </button>
          </div>

          {error && <p className="mt-2 text-xs font-bold text-[#DC2626]">{error}</p>}

          {/* Topic list */}
          <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
            {loading ? (
              <p className={`py-6 text-center text-xs font-medium ${textMuted}`}>Loading topics...</p>
            ) : topics.length === 0 ? (
              <p className={`py-6 text-center text-xs font-medium ${textMuted}`}>
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
        </ModalBody>
    </ModalFrame>
  );
}
