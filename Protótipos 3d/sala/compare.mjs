// node compare.mjs shots/sceneN.png — mean sRGB of reference vs render per region
import { createRequire } from 'node:module';
const sharp = createRequire('/home/eduardo/TNES/package.json')('sharp');
const regions = {
  'wall-upper-left':[200,100,600,300],'wall-center':[700,200,1000,500],'wall-right':[1100,100,1350,400],'wall-lower':[300,450,700,550],
  'pilaster':[10,100,50,600],'floor-front':[600,830,1100,860],'floor-back-center':[700,700,1000,715],
  'rug-left':[20,830,250,930],'rug-right':[1400,830,1660,930],'rug-center-front':[700,880,1000,910],
  'sofa-left-back':[60,640,180,700],'sofa-left-seat':[120,740,300,780],'sofa-right-back':[1470,620,1600,680],
  'sideboard-front':[120,570,540,630],'sideboard-top':[120,555,540,562],
  'table-top':[560,730,1050,780],'table-side':[560,800,1100,880],'bowl-big':[720,725,830,750],'books':[880,740,1000,760],
  'planter':[1590,590,1660,700],'leaves':[1450,150,1620,350],
};
async function means(file){const {data,info}=await sharp(file).resize(1672,941).raw().toBuffer({resolveWithObject:true});const W=info.width,C=info.channels;
  const out={};for(const [n,[x0,y0,x1,y1]] of Object.entries(regions)){let r=0,g=0,b=0,k=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*W+x)*C;r+=data[i];g+=data[i+1];b+=data[i+2];k++}out[n]=[r/k,g/k,b/k].map(Math.round)}return out}
const hex=a=>'#'+a.map(v=>v.toString(16).padStart(2,'0')).join('');
const [a,b]=await Promise.all([means('reference.png'),means(process.argv[2])]);
for(const n of Object.keys(regions)){const l=(a[n][0]+a[n][1]+a[n][2])/3,m=(b[n][0]+b[n][1]+b[n][2])/3;console.log(n.padEnd(18),hex(a[n]),hex(b[n]),'ratio',(m/l).toFixed(2))}
