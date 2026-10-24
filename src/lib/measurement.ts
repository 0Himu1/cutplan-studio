export type MeasurementUnit='mm'|'in';
export const MEASUREMENT_UNIT_KEY='cutplan.measurement-unit.v1';
export const MM_PER_INCH=25.4,SUTA_PER_INCH=8,MM_PER_SUTA=MM_PER_INCH/SUTA_PER_INCH;
/** Keep full precision here. Display rounding must never rewrite a saved measurement. */
export function inchSutaFromMm(mm:number):{inch:number;suta:number}|null{
 if(!Number.isFinite(mm)||mm<0)return null;
 const total=mm/MM_PER_INCH,inch=Math.floor(total),suta=(total-inch)*SUTA_PER_INCH;
 return {inch,suta};
}
export function mmFromInchSuta(inch:number,suta:number):number{
 if(!Number.isFinite(inch)||!Number.isFinite(suta)||inch<0||suta<0)return NaN;
 const value=(inch+suta/SUTA_PER_INCH)*MM_PER_INCH;return Number.isFinite(value)?Number(value.toFixed(12)):NaN;
}
export function measurementNumber(raw:string):number{
 const value=raw.trim().replace(',','.');return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)&&Number.isFinite(Number(value))?Number(value):NaN;
}
export function inchSutaDisplay(mm:number):{inch:string;suta:string}{
 const parts=inchSutaFromMm(mm);if(!parts)return {inch:'',suta:''};
 const suta=Number(parts.suta.toFixed(2));return suta>=8?{inch:String(parts.inch+1),suta:'0'}:{inch:String(parts.inch),suta:String(suta)};
}
/** Display units never alter physical measurements. Panel thickness is always metric. */
export function formatMeasurement(mm:number,unit:MeasurementUnit):string{
 if(unit==='mm')return `${Number(mm.toFixed(2))} mm`;
 const value=inchSutaDisplay(mm);return `${value.inch} in ${value.suta} suta`;
}
export function panelDimensionText(panel:{widthMm:number;heightMm:number},unit:MeasurementUnit){return `W ${formatMeasurement(panel.widthMm,unit)} · H ${formatMeasurement(panel.heightMm,unit)}`;}
