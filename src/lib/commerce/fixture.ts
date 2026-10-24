import {defaultFurniture,calculateFurniture} from '../furniture/families.ts';
import {priceQuote,type Policy,type Price} from './engine.ts';
import {customerQuote} from './presentation.ts';
/** Isolated UI/test fixture. Never used by live quote or order service. */
export function testQuoteInputs(){
 const input=defaultFurniture('table'),board='00000000-0000-4000-8000-000000000501';input.panelOverrides=Object.fromEntries(calculateFurniture(input).panels.map(p=>[p.panelId,{boardId:board,thicknessMm:25,stockWidthMm:1219,stockHeightMm:2438,grainAxis:'none' as const}]));
 const policy:Policy={version:'TEST-ONLY-1',approved:true,approvalReference:'SYNTHETIC-NOT-MANUFACTURING-APPROVAL',templates:['table-panel-trestle-v1'],engineVersion:'casework-review-1.0.0',machine:{version:'SYNTHETIC-ENVELOPE',approvalReference:'TEST-ONLY',maxWidthMm:1219,maxHeightMm:2438,spacingMm:4,marginMm:10},laborMinor:150000,deliveryMinor:100000,marginBps:1000,taxBps:0,discountMinor:0,areas:['Tejgaon (test)','Gazipur (test)'],finishesIncluded:true,edgingIncluded:true,hardwareIncluded:true};
 const prices:Price[]=[{itemId:board,versionId:'00000000-0000-4000-8000-000000000601',unit:'sheet',minor:'800000'}];
 return {input,policy,prices};
}
export function testQuotation(now=new Date().toISOString()){
 const {input,policy,prices}=testQuoteInputs();
 const snapshot=priceQuote(input,policy,prices,{projectId:'000000000000000000000000',revisionId:'00000000-0000-4000-8000-000000000301',revisionHash:'0'.repeat(64)}).snapshot!;
 return customerQuote({id:crypto.randomUUID(),project_id:snapshot.projectId,revision_id:snapshot.revisionId,issued_at:now,expires_at:new Date(Date.parse(now)+7*86400000).toISOString(),accepted_at:null,payload:snapshot,snapshot_hash:'0'.repeat(64),total_minor:snapshot.totalMinor});
}
