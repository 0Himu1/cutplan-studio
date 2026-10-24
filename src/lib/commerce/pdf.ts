import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {money} from './engine.ts';
import type {CustomerQuote} from './presentation.ts';
export async function quotePdf(q:CustomerQuote,testOnly=false):Promise<Uint8Array>{
 const pdf=await PDFDocument.create();pdf.setTitle(testOnly?'TEST ONLY - CutPlan Studio quotation':'CutPlan Studio quotation');pdf.setCreationDate(new Date(q.issuedAt));pdf.setModificationDate(new Date(q.issuedAt));
 const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);let page=pdf.addPage([595,842]),y=790;
 function text(value:string,size=10,heavy=false){if(y<55){page=pdf.addPage([595,842]);y=790;}page.drawText(value,{x:42,y,size,font:heavy?bold:font,color:rgb(.12,.14,.2)});y-=size+8;}
 text(testOnly?'TEST ONLY - NO COMMERCIAL VALUE':'CutPlan Studio - quotation',18,true);
 if(q.summary)text(`${q.summary.family.replaceAll('_',' ')}: ${q.summary.widthMm} W x ${q.summary.heightMm} H x ${q.summary.depthMm} D mm | ${q.summary.panelCount} panels`,11,true);
 text('Quote '+q.id);text('Project '+q.projectId);text('Revision '+q.revisionId);text('Design hash '+q.revisionHash,8);text('Issued (UTC) '+q.issuedAt);text('Expires (UTC) '+q.expiresAt);text('Currency BDT | '+q.rounding+' | '+q.formulaVersion,9);text('Policy version '+q.policyVersion,9);y-=10;
 for(const l of q.lines){text(l.label,10,true);text(`Quantity ${l.quantity} ${l.unit} | BDT ${money(l.amountMinor)}`);if(l.itemId)text('Material '+l.itemId,8);if(l.priceVersionId)text('Price version '+l.priceVersionId,8);}
 y-=10;text('Subtotal BDT '+money(q.subtotalMinor));text('Tax BDT '+money(q.taxMinor));text('Discount BDT '+money(q.discountMinor));text('Total BDT '+money(q.totalMinor),16,true);text(`${q.sheetCount} full stock sheets | ${Math.round(q.utilization*1000)/10}% panel utilization`);text('Non-panel area includes margins and spacing; not all reusable offcut.',9);text('Confirmation does not mean payment collected.',10,true);text('Delivery is limited to the quoted service-area list.',9);
 if(testOnly)text('Synthetic fixture and prices. No real email, payment or order.',10,true);
 return pdf.save();
}
