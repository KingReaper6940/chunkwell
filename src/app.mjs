import {splitText,measure,UNITS} from './core.mjs';import {exportReceipt,parseReceipt,compareSource,receiptTable} from './transfer.mjs';import {EXAMPLE} from './example.mjs';
const $=id=>document.getElementById(id);const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
let report=null,page=0;
function status(text,error=false){$('status').textContent=text;$('status').className=error?'error':'';}
function invalidate(){report=null;$('parts').replaceChildren();$('summary').replaceChildren();$('pager').replaceChildren();$('empty').hidden=false;$('handoff').hidden=true;$('badge').textContent='Needs splitting';status('Inputs changed. Make the parts to update the result.');counts();}
function counts(){const text=$('source').value;$('source-count').textContent=text.length.toLocaleString()+' UTF-16 units · '+measure(text,'bytes').toLocaleString()+' UTF-8 bytes · Limit: 100,000 UTF-16 units';}
function render(){
 $('parts').replaceChildren();$('pager').replaceChildren();
 if(!report)return;
 $('empty').hidden=report.parts.length>0;$('badge').textContent='Within budget';
 for(const [value,label] of [[report.parts.length,'parts'],[report.sourceBytes,'source bytes'],[report.parts.length?Math.max(...report.parts.map(p=>p.used)):0,'largest part']]){const block=node('div');block.append(node('strong','',value.toLocaleString()),document.createTextNode(label));$('summary').append(block);}
 for(let i=page*8;i<Math.min(report.parts.length,(page+1)*8);i++){
  const part=report.parts[i],card=node('article','part'),head=node('div','part-head');
  head.append(node('h3','','PART '+String(i+1).padStart(2,'0')),node('span','',part.used+' / '+report.limit+' '+UNITS[report.unit]));
  const field=node('textarea');field.readOnly=true;field.value=part.text;field.setAttribute('aria-label','Part '+(i+1)+' text');
  const meter=node('div','meter'),bar=node('span');bar.style.width=(part.used/report.limit*100)+'%';meter.append(bar);
  card.append(head,field,meter,node('p','offset','UTF-16 ['+part.start+', '+part.end+') · bytes ['+part.byteStart+', '+part.byteEnd+')'));
  const actions=node('div','part-actions'),copy=node('button','','Copy part'),save=node('button','','Save .txt');
  copy.setAttribute('aria-label','Copy part '+(i+1));save.setAttribute('aria-label','Save part '+(i+1));
  copy.addEventListener('click',async()=>{const current=report;try{await navigator.clipboard.writeText(part.text);if(report===current)status('Part '+(i+1)+' copied.');}catch{if(report===current)status('Clipboard unavailable. Select the part text or save it instead.',true);}});
  save.addEventListener('click',()=>download(part.text,'chunkwell-part-'+String(i+1).padStart(3,'0')+'.txt','text/plain'));
  actions.append(copy,save);card.append(actions);$('parts').append(card);
 }
 $('handoff').hidden=report.parts.length===0;if(report.parts.length)transfer();
 const pages=Math.ceil(report.parts.length/8);
 if(pages>1){for(const [text,delta] of [['Previous',-1],['Next',1]]){const button=node('button','',text);button.disabled=page+delta<0||page+delta>=pages;button.addEventListener('click',()=>{page+=delta;$('summary').replaceChildren();render();});$('pager').append(button);if(delta===-1)$('pager').append(node('span','','Page '+(page+1)+' of '+pages));}}
}
function run(){try{report=splitText($('source').value,{unit:$('unit').value,limit:Number($('limit').value),boundary:$('boundary').value});page=0;$('summary').replaceChildren();render();status(report.parts.length+' parts. Joining them restores the supplied text exactly.');}catch(error){invalidate();status(error.message,true);}}
for(const id of ['source','limit','unit','boundary'])$(id).addEventListener('input',invalidate);
$('example').addEventListener('click',()=>{$('source').value=EXAMPLE;$('limit').value='160';$('unit').value='bytes';$('boundary').value='readable';counts();run();});
$('split').addEventListener('click',run);
$('source').value=EXAMPLE;counts();run();

function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type:type+';charset=utf-8',endings:'transparent'}));const link=node('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function transfer(){
 const slot=$('transfer-slot');slot.replaceChildren();
 const actions=node('div','actions');
 for(const [name,file,type,content] of [
 ['Save receipt JSON','chunkwell-receipt.json','application/json',exportReceipt(report)],
 ['Save count table','chunkwell-counts.csv','text/csv',receiptTable(report)],
 ['Save rejoined text','chunkwell-rejoined.txt','text/plain',report.parts.map(p=>p.text).join('')]]){
  const button=node('button','',name);button.addEventListener('click',()=>download(content,file,type));actions.append(button);
 }
 slot.append(actions);
 const inspect=node('details'),summary=node('summary','','Inspect receipt JSON'),preview=node('textarea');preview.readOnly=true;preview.value=exportReceipt(report);preview.setAttribute('aria-label','Receipt export preview');inspect.append(summary,preview);slot.append(inspect);
 const verify=node('details'),title=node('summary','','Verify a receipt against this source'),label=node('label','','Paste receipt JSON'),input=node('textarea');input.id='receipt-input';input.spellcheck=false;label.htmlFor=input.id;
 const button=node('button','','Verify receipt'),result=node('p','help');result.setAttribute('role','status');
 button.addEventListener('click',()=>{try{const parsed=parseReceipt(input.value),check=compareSource(parsed,$('source').value);result.className=check.match?'help':'help error';result.textContent=check.match?'Verified: counts and boundaries are consistent, and the rejoined text matches this source exactly.':'Receipt is internally consistent, but source differs at UTF-16 offset '+check.firstDifference+'. This is not the same text.';}catch(error){result.className='help error';result.textContent=error.message;}});
 verify.append(title,label,input,button,result);slot.append(verify);
}
