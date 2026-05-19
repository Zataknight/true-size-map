import {
  Bookmark,
  BookmarkCheck,
  Link2,
  Loader2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { COUNTRIES } from "../data/countries";
import { useMapStore } from "../hooks/useMapStore";
import {
  useDeleteFavorite,
  useFavorites,
  useSaveFavorite,
} from "../hooks/useQueries";
import type { FavoriteEntry } from "../types/country";

const COUNTRY_MAP = new Map(COUNTRIES.map((c) => [c.id, c]));

const METRIC_LABELS: Record<string, string> = {
  area: "Alan",
  population: "Nüfus",
  gdp: "GSYİH",
};

function buildShareUrl(countryIds: string[], metric: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams();
  params.set("countries", countryIds.join(","));
  params.set("metric", metric);
  return `${base}?${params.toString()}`;
}

function FavoriteItem({
  fav,
  index,
}: {
  fav: FavoriteEntry;
  index: number;
}) {
  const { loadFavorite } = useMapStore();
  const deleteMutation = useDeleteFavorite();

  const date = new Date(fav.createdAt).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

  const countryLabels = useMemo(
    () =>
      fav.countryIds.map((id) => {
        const c = COUNTRY_MAP.get(id);
        return c ? `${c.flag} ${c.name}` : id.toUpperCase();
      }),
    [fav.countryIds],
  );

  const handleShare = () => {
    const url = buildShareUrl(fav.countryIds, fav.metric);
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Bağlantı kopyalandı!"))
      .catch(() => toast.error("Kopyalama başarısız."));
  };

  return (
    <div
      className="flex items-start gap-2 p-2 bg-card border border-border rounded-sm hover:border-primary/30 transition-colors group"
      data-ocid={`favorites.item.${index + 1}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Star size={10} className="text-primary shrink-0" />
          <span className="text-xs font-display font-semibold text-foreground truncate">
            {fav.name}
          </span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground truncate">
          {countryLabels.join(", ")} · {METRIC_LABELS[fav.metric] ?? fav.metric}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
          {date}
        </div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button
          type="button"
          onClick={() => {
            loadFavorite(fav);
            toast.success(`"${fav.name}" yüklendi`);
          }}
          className="text-[10px] font-mono text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
          data-ocid={`favorites.load_button.${index + 1}`}
        >
          Yükle
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="Bağlantıyı paylaş"
          data-ocid={`favorites.share_button.${index + 1}`}
          title="Bağlantıyı kopyala"
        >
          <Link2 size={11} />
        </button>
        <button
          type="button"
          onClick={() => deleteMutation.mutate(fav.id)}
          className="text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Sil"
          data-ocid={`favorites.delete_button.${index + 1}`}
          disabled={deleteMutation.isPending}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

interface SaveFormProps {
  onSaved: () => void;
}

function SaveForm({ onSaved }: SaveFormProps) {
  const [name, setName] = useState("");
  const saveMutation = useSaveFavorite();
  const { selectedCountries, comparisonMetric } = useMapStore();

  const handleSave = () => {
    if (!name.trim()) return;
    saveMutation.mutate(name.trim(), {
      onSuccess: () => {
        toast.success("Favori kaydedildi!");
        setName("");
        onSaved();
      },
      onError: () => {
        toast.error("Kaydetme başarısız. Tekrar deneyin.");
      },
    });
  };

  const handleShareCurrent = () => {
    if (selectedCountries.length === 0) return;
    const ids = selectedCountries.map((c) => c.id);
    const url = buildShareUrl(ids, comparisonMetric);
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Bağlantı kopyalandı!"))
      .catch(() => toast.error("Kopyalama başarısız."));
  };

  const disabled =
    !name.trim() || saveMutation.isPending || selectedCountries.length === 0;

  return (
    <div className="flex flex-col gap-2 p-3 bg-muted/40 border border-border rounded-sm">
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
        {selectedCountries.length === 0
          ? "Önce ülke seçin"
          : `${selectedCountries.length} ülke seçili`}
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !disabled && handleSave()}
        placeholder="Karşılaştırma adı..."
        className="bg-background border border-input rounded-sm px-2 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        maxLength={60}
        data-ocid="favorites.name_input"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={disabled}
        className="flex items-center justify-center gap-1.5 bg-primary text-background text-[11px] font-mono uppercase tracking-wider py-1.5 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        data-ocid="favorites.save_button"
      >
        {saveMutation.isPending ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <BookmarkCheck size={11} />
        )}
        Kaydet
      </button>
      {selectedCountries.length > 0 && (
        <button
          type="button"
          onClick={handleShareCurrent}
          className="flex items-center justify-center gap-1.5 border border-border text-[11px] font-mono text-muted-foreground uppercase tracking-wider py-1.5 rounded-sm hover:text-foreground hover:border-primary/40 transition-colors"
          data-ocid="favorites.share_current_button"
        >
          <Link2 size={11} />
          Bağlantıyı Kopyala
        </button>
      )}
    </div>
  );
}

interface FavoritesPanelProps {
  onClose: () => void;
}

export function FavoritesPanel({ onClose }: FavoritesPanelProps) {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const { favorites } = useMapStore();
  useFavorites(); // sync from backend on mount

  return (
    <div
      className="absolute top-0 right-0 h-full w-72 bg-card border-l border-border z-20 flex flex-col shadow-lg"
      data-ocid="favorites.panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Bookmark size={14} className="text-primary" />
          <span className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">
            Favoriler
          </span>
          {favorites.length > 0 && (
            <span className="text-[10px] font-mono bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm">
              {favorites.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSaveForm((v) => !v)}
            className="text-[10px] font-mono text-primary hover:opacity-80 transition-opacity uppercase tracking-wider"
            data-ocid="favorites.toggle_save_form_button"
          >
            {showSaveForm ? "İptal" : "+ Yeni"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Kapat"
            data-ocid="favorites.close_button"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Save form */}
      {showSaveForm && (
        <div className="px-3 pt-3 shrink-0">
          <SaveForm onSaved={() => setShowSaveForm(false)} />
        </div>
      )}

      {/* Favorites list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {favorites.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-8"
            data-ocid="favorites.empty_state"
          >
            <Bookmark size={24} className="text-muted-foreground/30" />
            <p className="text-xs font-mono text-muted-foreground">
              Henüz favori yok.
              <br />
              Ülkeleri seç ve kaydet.
            </p>
          </div>
        ) : (
          favorites.map((fav, i) => (
            <FavoriteItem key={fav.id} fav={fav} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
