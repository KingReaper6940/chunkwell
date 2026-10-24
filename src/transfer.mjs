import {splitText,validateText} from './core.mjs';
export function exportReceipt(report){return JSON.stringify(report,null,2)+'\n';}
export function parseReceipt(text){
 if(typeof text!=='string'||text.length>1500000)throw new Error('Receipt must be JSON text under 1.5 million UTF-16 units.');
 let value;try{value=JSON.parse(text);}catch{throw new Error('Receipt is not valid JSON.');}
 if(!value||value.format!=='chunkwell-v1'||!Array.isArray(value.parts)||value.parts.length>500)throw new Error('Not a supported Chunkwell receipt.');
 const source=value.parts.map(p=>{if(!p||typeof p.text!=='string')throw new Error('Each part needs text.');return p.text;}).join('');
 validateText(source);
 const expected=splitText(source,{unit:value.unit,limit:value.limit,boundary:value.boundary});
 const fields=['start','end','byteStart','byteEnd','used','text'];
 if(value.sourceUnits!==expected.sourceUnits||value.sourceBytes!==expected.sourceBytes||value.parts.length!==expected.parts.length||
 value.parts.some((p,i)=>fields.some(field=>p[field]!==expected.parts[i]?.[field])))throw new Error('Receipt counts, boundaries or offsets do not match its text.');
 return expected;
}
export function compareSource(report,source){
 validateText(source);const joined=report.parts.map(p=>p.text).join('');
 let index=0;while(index<Math.min(source.length,joined.length)&&source[index]===joined[index])index++;
 const match=source===joined;
 return {match,firstDifference:match?null:index,expectedUnits:source.length,actualUnits:joined.length};
}
export function receiptTable(report){
 return 'part,start_utf16,end_utf16,start_byte,end_byte,used,limit,unit\r\n'+report.parts.map((p,i)=>[i+1,p.start,p.end,p.byteStart,p.byteEnd,p.used,report.limit,report.unit].join(',')).join('\r\n')+'\r\n';
}
