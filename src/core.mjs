const encoder=new TextEncoder();
export const MAX_INPUT=100000,MAX_PARTS=500;
export const UNITS={bytes:'UTF-8 bytes',utf16:'UTF-16 units',points:'Code points',graphemes:'Graphemes'};
const segmenter=new Intl.Segmenter('en',{granularity:'grapheme'});
export function validateText(text){
 if(typeof text!=='string'||text.length>MAX_INPUT)throw new Error('Use at most 100,000 UTF-16 units of text.');
 for(const char of text){const n=char.codePointAt(0);if(n>=0xd800&&n<=0xdfff)throw new Error('Text contains an unpaired surrogate. Replace it before splitting.');}
 return text;
}
export function measure(text,unit='bytes'){
 if(!(Object.hasOwn(UNITS,unit)))throw new Error('Choose a supported counting unit.');
 if(unit==='bytes')return encoder.encode(text).length;
 if(unit==='utf16')return text.length;
 if(unit==='points')return Array.from(text).length;
 return Array.from(segmenter.segment(text)).length;
}
export function splitText(text,{limit=280,unit='bytes',boundary='tight'}={}){
 validateText(text);
 if(!Number.isSafeInteger(limit)||limit<1||limit>100000)throw new Error('Budget must be a whole number from 1 to 100,000.');
 if(!(Object.hasOwn(UNITS,unit)))throw new Error('Choose a supported counting unit.');
 if(!['tight','readable'].includes(boundary))throw new Error('Choose a supported boundary preference.');
 const atoms=Array.from(segmenter.segment(text),({segment,index})=>({text:segment,start:index,cost:unit==='graphemes'?1:measure(segment,unit)}));
 const parts=[];let cursor=0,byteOffset=0;
 while(cursor<atoms.length){
  const start=cursor;let end=cursor,total=0;
  while(end<atoms.length&&total+atoms[end].cost<=limit){total+=atoms[end].cost;end++;}
  if(end===start)throw new Error('A grapheme at UTF-16 offset '+atoms[start].start+' needs '+atoms[start].cost+' '+UNITS[unit]+'. Increase the budget; it will not be broken.');
  if(boundary==='readable'&&end<atoms.length){
   let used=0,line=-1,space=-1;
   for(let i=start;i<end;i++){used+=atoms[i].cost;if(used<total*.6)continue;
    if(/[\r\n]/u.test(atoms[i].text))line=i+1;
    else if(/^\s+$/u.test(atoms[i].text))space=i+1;
   }
   const cut=line>start?line:space;
   if(cut>start){end=cut;total=atoms.slice(start,end).reduce((sum,a)=>sum+a.cost,0);}
  }
  const chunk=text.slice(atoms[start].start,end<atoms.length?atoms[end].start:text.length);
  const bytes=encoder.encode(chunk).length;
  parts.push({text:chunk,start:atoms[start].start,end:atoms[start].start+chunk.length,byteStart:byteOffset,byteEnd:byteOffset+bytes,used:total});
  if(parts.length>MAX_PARTS)throw new Error('This would exceed 500 parts. Increase the budget.');
  cursor=end;byteOffset+=bytes;
 }
 return {format:'chunkwell-v1',unit,limit,boundary,sourceUnits:text.length,sourceBytes:byteOffset,parts};
}
