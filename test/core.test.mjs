import test from 'node:test';import assert from 'node:assert/strict';import {measure,splitText} from '../src/core.mjs';
test('unbroken ASCII always respects byte cap',()=>{const r=splitText('x'.repeat(5000),{limit:4096});assert.deepEqual(r.parts.map(p=>p.used),[4096,904]);assert.equal(r.parts.map(p=>p.text).join(''),'x'.repeat(5000));});
test('units differ for emoji and combining marks',()=>{assert.equal(measure('🙂','bytes'),4);assert.equal(measure('🙂','utf16'),2);assert.equal(measure('e\u0301','points'),2);assert.equal(measure('e\u0301','graphemes'),1);});
test('family emoji stays intact and oversized grapheme fails',()=>{const text='👩‍👩‍👧‍👦';assert.equal(splitText(text,{unit:'graphemes',limit:1}).parts.length,1);assert.throws(()=>splitText(text,{limit:4}),/Increase the budget/);});
test('empty text has no parts',()=>assert.equal(splitText('').parts.length,0));
test('validates budgets, text, units and safety bounds',()=>{for(const limit of [0,1.2,NaN,100001])assert.throws(()=>splitText('a',{limit}));assert.throws(()=>splitText('\ud800'));assert.throws(()=>splitText('a'.repeat(100001)));assert.throws(()=>splitText('a'.repeat(501),{limit:1}),/500/);assert.throws(()=>splitText('a',{unit:'tokens'}));});

test('readable boundaries retain exact whitespace and choose a late newline',()=>{const source='one two\nthree four five';const r=splitText(source,{limit:12,boundary:'readable'});assert.equal(r.parts[0].text,'one two\n');assert.equal(r.parts.map(p=>p.text).join(''),source);});
test('readable mode does not create tiny leading whitespace parts',()=>{assert.equal(splitText('a '+ 'b'.repeat(20),{limit:10,boundary:'readable'}).parts[0].used,10);});
test('CRLF remains an intact grapheme with exact byte offsets',()=>{const source='ab\r\n界🙂';const r=splitText(source,{limit:4});assert.deepEqual(r.parts.map(p=>p.text),['ab\r\n','界','🙂']);assert.deepEqual(r.parts.map(p=>[p.byteStart,p.byteEnd]),[[0,4],[4,7],[7,11]]);});

test('seeded Unicode invariants across all units and both boundary modes',()=>{
 let seed=1741;const pick=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};const atoms=['a','界','🙂','e\u0301','👩‍💻',' ','\n','\r\n','🇨🇦','<b>'];
 for(let sample=0;sample<32;sample++){const text=Array.from({length:40},()=>atoms[pick()%atoms.length]).join('');
  for(const unit of ['bytes','utf16','points','graphemes'])for(const boundary of ['tight','readable']){
   const limit=32+pick()%40;const r=splitText(text,{limit,unit,boundary});
   assert.equal(r.parts.map(p=>p.text).join(''),text);let offset=0,bytes=0;
   const edges=new Set([0,...Array.from(new Intl.Segmenter('en',{granularity:'grapheme'}).segment(text),x=>x.index),text.length]);
   for(const p of r.parts){assert.ok(p.text.length>0);assert.ok(measure(p.text,unit)<=limit);assert.equal(p.used,measure(p.text,unit));assert.equal(p.start,offset);assert.equal(p.byteStart,bytes);assert.ok(edges.has(p.end));offset=p.end;bytes=p.byteEnd;}
   assert.equal(offset,text.length);assert.equal(bytes,new TextEncoder().encode(text).length);
  }
 }
});
test('prototype property names cannot select counting units',()=>{assert.throws(()=>splitText('a',{unit:'constructor'}));assert.throws(()=>measure('a','toString'));});
test('bounded larger input respects cap without truncation',()=>{const source='界🙂word '.repeat(2000);const r=splitText(source,{limit:512,boundary:'readable'});assert.equal(r.parts.map(p=>p.text).join(''),source);assert.ok(r.parts.every(p=>p.used<=512));});
