/** Uncompressed ZIP: every sheet remains a separate program and requires its own stock setup. */
export function zipFiles(files:{name:string;text:string}[]):Uint8Array{
 const encoder=new TextEncoder(),chunks:Uint8Array[]=[],directory:Uint8Array[]=[];let offset=0,total=0;
 const header=(size:number)=>{const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)};};
 const crc=(data:Uint8Array)=>{let value=0xffffffff;for(const byte of data){value^=byte;for(let k=0;k<8;k++)value=(value>>>1)^((value&1)?0xedb88320:0);}return (value^0xffffffff)>>>0;};
 for(const file of files){const name=encoder.encode(file.name),data=encoder.encode(file.text),checksum=crc(data),local=header(30);local.view.setUint32(0,0x04034b50,true);local.view.setUint16(4,20,true);local.view.setUint16(6,0x800,true);local.view.setUint32(14,checksum,true);local.view.setUint32(18,data.length,true);local.view.setUint32(22,data.length,true);local.view.setUint16(26,name.length,true);chunks.push(local.bytes,name,data);
  const central=header(46);central.view.setUint32(0,0x02014b50,true);central.view.setUint16(4,20,true);central.view.setUint16(6,20,true);central.view.setUint16(8,0x800,true);central.view.setUint32(16,checksum,true);central.view.setUint32(20,data.length,true);central.view.setUint32(24,data.length,true);central.view.setUint16(28,name.length,true);central.view.setUint32(42,offset,true);directory.push(central.bytes,name);offset+=30+name.length+data.length;total+=46+name.length;
 }
 const end=header(22);end.view.setUint32(0,0x06054b50,true);end.view.setUint16(8,files.length,true);end.view.setUint16(10,files.length,true);end.view.setUint32(12,total,true);end.view.setUint32(16,offset,true);const all=[...chunks,...directory,end.bytes],out=new Uint8Array(offset+total+22);let position=0;for(const block of all){out.set(block,position);position+=block.length;}return out;
}
