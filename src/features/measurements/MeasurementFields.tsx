import { useState } from 'react';
import { templates, type GarmentType } from '../../domain/model';
import { parseMeasurement } from '../../domain/validation';
import { GarmentIllustration } from './GarmentIllustration';
export function MeasurementFields({ garment, values, onChange }: { garment: GarmentType; values: Record<string, string>; onChange: (values: Record<string, string>) => void }) {
 const template = templates.find(t => t.garment === garment)!; const [active,setActive] = useState(template.fields[0].id);
 const complete = template.fields.filter(f => { const n = parseMeasurement(values[f.id] || ''); return n !== null && n > 0 && n < 100; }).length;
 return <div className="measurement-studio"><div className="measurement-preview"><span className="eyebrow">MEASUREMENT STUDIO</span><GarmentIllustration garment={garment} active={active} values={values}/><div className="measurement-readout"><span>{template.fields.find(f=>f.id===active)?.label}</span><strong>{values[active] || '—'} <small>in</small></strong></div><small>{complete} of {template.fields.length} recorded</small></div><div className="formgrid">{template.fields.map((field,index) => <label className={active===field.id?'field-active':''} key={field.id}><span className="field-number">0{index+1}</span>{field.label}<span className="input-unit"><input aria-label={`${field.label} (in)`} inputMode="decimal" placeholder="0.00" value={values[field.id] ?? ''} onFocus={()=>setActive(field.id)} onChange={event => onChange({ ...values, [field.id]: event.target.value })}/><span>in</span></span></label>)}</div></div>;
}
