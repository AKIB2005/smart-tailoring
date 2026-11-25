import type { GarmentType } from '../../domain/model';
import { GarmentIllustration } from './GarmentIllustration';
/** Visual selection only. Phase 3 will supply verified presets and specifications. */
export function GarmentPresetCard({ garment, name, description, selected, onSelect }: { garment: GarmentType; name: string; description: string; selected: boolean; onSelect: ()=>void }) {
 return <button type="button" className={`garment-card preset-card ${selected?'selected':''}`} aria-pressed={selected} onClick={onSelect}><GarmentIllustration garment={garment}/><span><strong>{name}</strong><small>{description}</small></span>{selected && <span className="garment-add">✓</span>}</button>;
}
