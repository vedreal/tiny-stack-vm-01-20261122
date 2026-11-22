// tiny-stack-vm-01-20261122: a fast, exact interpreter for make.fun's tiny stack ISA v1.
// Written from generator/subject/ISA.md and the reference VM generator/subject/vm.mjs.
// No clock, no randomness: two runs write byte-identical output.
import {mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

// Opcode table: [byte, immediate bytes, pops, pushes] x 37; stored as (imm<<4)|(pops<<2)|pushes, +1,
// so 0 in the map means "no such opcode".
const OPS=[0,0,0,0, 1,1,0,1, 2,4,0,1, 3,0,1,0, 4,0,1,2, 5,0,2,2, 6,0,2,3, 7,0,3,3,
 16,0,2,1, 17,0,2,1, 18,0,2,1, 19,0,2,1, 20,0,2,1, 21,0,2,1, 22,0,2,1, 23,0,1,1,
 24,0,2,1, 25,0,2,1, 26,0,2,1, 27,0,1,1, 28,0,2,1, 29,0,2,1, 30,0,2,1, 32,0,2,1, 33,0,2,1, 34,0,2,1,
 48,2,0,0, 49,2,1,0, 50,2,1,0, 51,2,0,0, 52,0,0,0, 64,0,1,1, 65,0,2,0, 80,0,1,0, 81,0,1,0, 82,0,0,1, 83,0,1,0];
const T=new Uint8Array(256);
for(let i=0;i<OPS.length;i+=4)T[OPS[i]]=((OPS[i+1]<<4)|(OPS[i+2]<<2)|OPS[i+3])+1;

const enc=new TextEncoder();
function run(p:Uint8Array,inp:Uint8Array):[Uint8Array,number]{
  const n=p.length,D=new Int32Array(256);let sp=0;
  const C=new Int32Array(64);let csp=0;
  const M=new Int32Array(256);
  const out=new Uint8Array(65536);let ol=0,ip=0,pc=0,steps=0;
  const end=(code:number):[Uint8Array,number]=>[out.slice(0,ol),code];
  for(;;){
    if(steps===1000000)return end(10);
    if(pc<0||pc>=n)return end(9);
    const op=p[pc],t=T[op];
    if(!t)return end(5);
    const d=t-1,imm=d>>4,po=(d>>2)&3,pu=d&3;
    if(pc+imm>=n)return end(9);
    steps++;
    const nx=pc+1+imm;
    if(sp<po)return end(2);
    if(sp-po+pu>256)return end(3);
    pc=nx;
    switch(op){
      case 0:return end(0);
      case 1:D[sp++]=(p[nx-1]<<24)>>24;break;
      case 2:D[sp++]=p[nx-4]|(p[nx-3]<<8)|(p[nx-2]<<16)|(p[nx-1]<<24);break;
      case 3:sp--;break;
      case 4:D[sp]=D[sp-1];sp++;break;
      case 5:{const x=D[sp-1];D[sp-1]=D[sp-2];D[sp-2]=x;break;}
      case 6:D[sp]=D[sp-2];sp++;break;
      case 7:{const a=D[sp-3];D[sp-3]=D[sp-2];D[sp-2]=D[sp-1];D[sp-1]=a;break;}
      case 0x17:D[sp-1]=-D[sp-1]|0;break;
      case 0x1b:D[sp-1]=~D[sp-1];break;
      case 0x10:case 0x11:case 0x12:case 0x13:case 0x14:case 0x15:case 0x16:
      case 0x18:case 0x19:case 0x1a:case 0x1c:case 0x1d:case 0x1e:case 0x20:case 0x21:case 0x22:{
        const b=D[sp-1],a=D[sp-2];let r=0;
        if(op===0x10)r=(a+b)|0;
        else if(op===0x11)r=(a-b)|0;
        else if(op===0x12)r=Math.imul(a,b);
        else if(op===0x13){if(!b)return end(4);r=a===-2147483648&&b===-1?a:(a/b)|0;}
        else if(op===0x14){if(!b)return end(4);r=b===-1?0:(a%b)|0;}
        else if(op===0x15){if(!b)return end(4);r=Math.floor((a>>>0)/(b>>>0))|0;}
        else if(op===0x16){if(!b)return end(4);r=((a>>>0)%(b>>>0))|0;}
        else if(op===0x18)r=a&b;
        else if(op===0x19)r=a|b;
        else if(op===0x1a)r=a^b;
        else if(op===0x1c)r=a<<(b&31);
        else if(op===0x1d)r=a>>(b&31);
        else if(op===0x1e)r=(a>>>(b&31))|0;
        else if(op===0x20)r=a===b?1:0;
        else if(op===0x21)r=a<b?1:0;
        else r=(a>>>0)<(b>>>0)?1:0;
        D[sp-2]=r;sp--;break;
      }
      case 0x30:case 0x31:case 0x32:{
        const rel=((p[nx-2]|(p[nx-1]<<8))<<16)>>16;
        let take=true;
        if(op!==0x30){const v=D[--sp];take=op===0x31?v===0:v!==0;}
        if(take)pc=nx+rel;
        break;
      }
      case 0x33:
        if(csp===64)return end(7);
        C[csp++]=nx;pc=p[nx-2]|(p[nx-1]<<8);break;
      case 0x34:
        if(!csp)return end(8);
        pc=C[--csp];break;
      case 0x40:{const a=D[sp-1];if(a<0||a>255)return end(6);D[sp-1]=M[a];break;}
      case 0x41:{const a=D[sp-1];if(a<0||a>255)return end(6);M[a]=D[sp-2];sp-=2;break;}
      case 0x50:{const s=enc.encode(String(D[sp-1]));if(ol+s.length>65536)return end(11);sp--;out.set(s,ol);ol+=s.length;break;}
      case 0x51:
        if(ol+1>65536)return end(11);
        out[ol++]=D[--sp]&255;break;
      case 0x52:D[sp++]=ip<inp.length?inp[ip++]:-1;break;
      case 0x53:return end(D[--sp]&255);
    }
  }
}

const I=process.env.MAKEFUN_INPUT_DIR??'/input';
const O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
for(const id of readdirSync(I).sort()){
  const r=run(readFileSync(join(I,id,'program.bin')),readFileSync(join(I,id,'input.bin')));
  mkdirSync(join(O,id),{recursive:true});
  writeFileSync(join(O,id,'stdout.bin'),r[0]);
  writeFileSync(join(O,id,'exit.txt'),r[1]+'\n');
}
