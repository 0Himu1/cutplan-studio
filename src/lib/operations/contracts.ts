export const STATUSES=['confirmed','in_production','ready_for_delivery','delivered'] as const;
export type OrderStatus=typeof STATUSES[number];
export type MachineProfile={id:string;manufacturerId:string;version:string;qualified:boolean;approvalReference:string;envelopes:string[];widthMm:number;heightMm:number;toolDiameterMm:number;minMarginMm:number;maxThicknessMm:number;operations:string[]};
export type Scope={snapshotHash:string;revisionId:string;envelope:string;spacingMm:number;marginMm:number;sheets:{width:number;height:number;thicknessMm:number}[]};
export type Bid={id:string;manufacturerId:string;profileId:string;revisionId:string;scopeHash:string;amountMinor:string;qualified:boolean;validUntil:string};
export function assignmentIssues(scope:Scope,bid:Bid,profile:MachineProfile,now=Date.now()):string[]{
 const issues:string[]=[];
 if(!bid.qualified||!profile.qualified||!profile.approvalReference)issues.push('Bid and machine qualification must be approved.');
 if(bid.scopeHash!==scope.snapshotHash||bid.revisionId!==scope.revisionId)issues.push('Bid does not match the accepted revision and scope.');
 if(bid.profileId!==profile.id||bid.manufacturerId!==profile.manufacturerId)issues.push('Machine profile belongs to a different partner.');
 if(!/^\d{1,14}$/.test(bid.amountMinor)||!Number.isFinite(Date.parse(bid.validUntil))||Date.parse(bid.validUntil)<=now)issues.push('Bid is invalid or expired.');
 if(!profile.envelopes.includes(scope.envelope)||!profile.operations.includes('rectangular_profile'))issues.push('Machine is not qualified for the accepted capability envelope.');
 if([profile.widthMm,profile.heightMm,profile.toolDiameterMm,profile.maxThicknessMm].some(n=>!Number.isFinite(n)||n<=0)||!Number.isFinite(profile.minMarginMm)||profile.minMarginMm<0)issues.push('Machine bounds are invalid.');
 if(scope.spacingMm<profile.toolDiameterMm||scope.marginMm<profile.minMarginMm||scope.sheets.some(s=>s.width>profile.widthMm||s.height>profile.heightMm||s.thicknessMm>profile.maxThicknessMm))issues.push('Accepted stock, spacing or margins are incompatible. Do not repack the order.');
 return [...new Set(issues)];
}
export function nextStatus(status:OrderStatus):OrderStatus|null{return STATUSES[STATUSES.indexOf(status)+1]??null;}
