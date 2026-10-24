import {splitText,measure,UNITS} from './core.mjs';import {EXAMPLE} from './example.mjs';
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
  $('parts').append(card);
 }
 const pages=Math.ceil(report.parts.length/8);
 if(pages>1){for(const [text,delta] of [['Previous',-1],['Next',1]]){const button=node('button','',text);button.disabled=page+delta<0||page+delta>=pages;button.addEventListener('click',()=>{page+=delta;$('summary').replaceChildren();render();});$('pager').append(button);if(delta===-1)$('pager').append(node('span','','Page '+(page+1)+' of '+pages));}}
}
function run(){try{report=splitText($('source').value,{unit:$('unit').value,limit:Number($('limit').value),boundary:$('boundary').value});page=0;$('summary').replaceChildren();render();status(report.parts.length+' parts. Joining them restores the supplied text exactly.');}catch(error){invalidate();status(error.message,true);}}
for(const id of ['source','limit','unit','boundary'])$(id).addEventListener('input',invalidate);
$('example').addEventListener('click',()=>{$('source').value=EXAMPLE;$('limit').value='160';$('unit').value='bytes';$('boundary').value='readable';counts();run();});
$('split').addEventListener('click',run);
$('source').value=EXAMPLE;counts();run();
