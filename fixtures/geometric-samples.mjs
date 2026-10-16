// Independently authored polylines, not copied from the recognition reference patterns.
// Three deterministic deformations per character are a smoke test, NOT human accuracy evidence.
const line = (x1,y1,x2,y2) => [[x1,y1],[x2,y2]];
const box = (x=60,y=40,w=130,h=170) => [line(x,y,x,y+h), [[x,y],[x+w,y],[x+w,y+h]], line(x,y+h,x+w,y+h)];
const tree = (x=30,y=30,w=190,h=190) => [line(x,y+h*.35,x+w,y+h*.35),line(x+w*.5,y,x+w*.5,y+h),[[x+w*.5,y+h*.35],[x+w*.27,y+h*.67],[x,y+h]],[[x+w*.5,y+h*.35],[x+w*.74,y+h*.70],[x+w,y+h]]];
const human = [ [[130,30],[120,95],[85,165],[35,220]], [[120,95],[163,165],[220,220]] ];
const big = [line(30,90,220,90),...human];
const bases = {
  日: [...box(),line(60,123,190,123)],
  目: [...box(),line(60,98,190,98),line(60,152,190,152)],
  田: [...box(),line(60,123,190,123),line(125,40,125,210)],
  由: [...box(60,75,130,140),line(60,145,190,145),line(125,25,125,215)],
  申: [...box(60,65,130,120),line(60,125,190,125),line(125,20,125,235)],
  甲: [...box(60,40,130,120),line(60,100,190,100),line(125,40,125,235)],
  白: [line(115,20,90,60),...box(60,60,130,150),line(60,130,190,130)],
  百: [line(25,35,225,35),line(130,35,105,75),...box(60,75,130,140),line(60,145,190,145)],
  月: [[[70,35],[70,155],[48,225]],[[70,35],[190,35],[190,220],[165,215]],line(70,95,190,95),line(70,153,190,153)],
  人: human,
  入: [[[70,35],[115,65],[145,130],[205,220]],[[137,110],[95,180],[40,220]]],
  大: big,
  太: [...big,line(120,180,145,209)],
  犬: [...big,line(180,35,205,60)],
  木: tree(),
  本: [...tree(),line(73,180,180,180)],
  休: [[[80,25],[55,85],[20,130]],line(55,85,55,230),...tree(85,25,150,205)],
  林: [...tree(15,30,100,200),...tree(130,30,105,200)],
  森: [...tree(60,15,140,100),...tree(15,125,100,110),...tree(135,125,105,110)],
  語: [line(45,20,60,35),line(15,55,95,55),line(25,85,85,85),line(25,110,85,110),...box(25,145,60,80),line(120,35,225,35),line(165,35,145,125),[[125,75],[210,75],[205,125]],line(110,125,235,125),...box(125,155,95,70)],
};
function densify(stroke) {
  return stroke.flatMap((p,index) => {
    if (!index) return [p];
    const before=stroke[index-1], steps=Math.max(1,Math.ceil(Math.hypot(p[0]-before[0],p[1]-before[1])/5));
    return Array.from({length:steps},(_,j)=>[before[0]+(p[0]-before[0])*(j+1)/steps,before[1]+(p[1]-before[1])*(j+1)/steps]);
  });
}
export const geometricSamples = Object.entries(bases).flatMap(([character,strokes]) => [0,1,2].map(variant=>({
  character, variant, provenance:'agent-authored-geometric-fixture',
  strokes:strokes.map((stroke,s)=>densify(stroke).map(([x,y],p)=>[
    Math.max(0,Math.min(256, x*(1-variant*.035)+variant*4+Math.sin(p*.7+s)*variant*1.7)),
    Math.max(0,Math.min(256, y*(1-variant*.025)+variant*3+Math.cos(p*.5+s)*variant*1.5)),
  ])),
})));
