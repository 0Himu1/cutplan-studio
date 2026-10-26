import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCabinet } from '../../src/lib/furniture/cabinet.ts';
import { CABINET_FIXTURES } from '../../src/lib/furniture/cabinet-fixtures.ts';

const base = CABINET_FIXTURES[0].input;
const calculate = changes => calculateCabinet({ ...base, ...changes });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('inset golden fixture has exact individual panels and transforms', () => {
  const result = calculate({});
  assert.deepEqual(result.blockingErrors, []);
  const expected = [
    ['side-left', 400, 1200, 18, [9,600,200], [0,-Math.PI/2,0]],
    ['side-right', 400, 1200, 18, [791,600,200], [0,-Math.PI/2,0]],
    ['top', 764, 400, 18, [400,1191,200], [-Math.PI/2,0,0]],
    ['bottom', 764, 400, 18, [400,9,200], [-Math.PI/2,0,0]],
    ['back', 764, 1164, 6, [400,600,3], [0,0,0]],
    ['shelf-1', 760, 348.6, 18, [400,403,180.3], [-Math.PI/2,0,0]],
    ['shelf-2', 760, 348.6, 18, [400,797,180.3], [-Math.PI/2,0,0]],
    ['door-1', 379, 1160, 18, [209.5,600,391], [0,0,0]],
    ['door-2', 379, 1160, 18, [590.5,600,391], [0,0,0]]
  ];
  assert.deepEqual(result.panels.map(p => [p.componentId,p.widthMm,p.heightMm,p.thicknessMm,p.pose.positionMm,p.pose.rotationRad]), expected);
  assert.equal(result.manufacturingApproved, false);
  assert.equal(result.eligibleForQuote, false);
});

test('outside back and plinth golden fixture preserves overall envelope', () => {
  const result = calculateCabinet(CABINET_FIXTURES[1].input);
  assert.deepEqual(result.blockingErrors, []);
  const byId = Object.fromEntries(result.panels.map(p => [p.componentId, p]));
  assert.equal(result.panels.length, 10);
  assert.deepEqual([byId.back.widthMm, byId.back.heightMm, byId.back.pose.positionMm], [800,1200,[400,600,3]]);
  assert.deepEqual([byId.top.widthMm, byId.top.heightMm, byId.top.pose.positionMm], [764,394,[400,1191,203]]);
  assert.deepEqual(byId.bottom.pose.positionMm, [400,89,203]);
  assert.deepEqual(byId['plinth-front'].pose.positionMm, [400,40,351]);
  near(byId['shelf-1'].pose.positionMm[1], 456.3333333333333);
  near(byId['shelf-2'].pose.positionMm[1], 823.6666666666666);
});

test('invalid and unsupported runtime inputs return no partial geometry', () => {
  for (const value of [null, [], 'cabinet', {}, { ...base, widthMm: NaN }, { ...base, heightMm: Infinity }, { ...base, shelfCount: 1.5 }, { ...base, shelfCount: 21 }, { ...base, doorCount: 3 }, { ...base, drawerCount: 1 }, { ...base, backPosition: 'grooved' }, { ...base, grainAxis: 'diagonal' }, { ...base, doorGapMm: 0 }, { ...base, widthMm: -20 }, { ...base, shelfSideClearanceMm: -1 }]) {
    const result = calculateCabinet(value);
    assert.ok(result.blockingErrors.length);
    assert.deepEqual(result.panels, []);
  }
});

test('minimum face, shelf clearance and stock boundaries are enforced; thin backs are allowed', () => {
  assert.deepEqual(calculate({ backThicknessMm: 3 }).blockingErrors, []);
  for (const changes of [{ widthMm: 80 }, { shelfCount: 20, heightMm: 300 }, { shelfSideClearanceMm: 400 }, { doorGapMm: 400 }, { doorThicknessMm: 400 }, { skirtingHeightMm: 20 }, { skirtingHeightMm: 1190 }, { skirtingHeightMm: 80, plinthSetbackMm: 395 }, { stockMarginMm: 700 }]) {
    const result = calculate(changes);
    assert.ok(result.blockingErrors.length, JSON.stringify(changes));
    assert.deepEqual(result.panels, []);
  }
  assert.deepEqual(calculate({ doorCount: 0, shelfCount: 0, widthMm: 86 }).blockingErrors, []); // 50 mm inner width, 18 mm sides
  assert.ok(calculate({ doorCount: 0, shelfCount: 0, widthMm: 85.99 }).blockingErrors.length);
  assert.deepEqual(calculate({ stockWidthMm: 1220, stockHeightMm: 784 }).blockingErrors, []); // rotated back fits exactly; side reaches usable stock width
  assert.ok(calculate({ stockWidthMm: 1220, stockHeightMm: 784, grainAxis: 'height' }).stockIssues.length);
});

test('stable identities survive resizing and shelf additions; output is deterministic and input immutable', () => {
  const input = structuredClone(base), before = structuredClone(input);
  const first = calculateCabinet(input), second = calculateCabinet(input);
  assert.deepEqual(first, second); assert.deepEqual(input, before);
  const resized = calculate({ widthMm: 900, shelfCount: 3 });
  for (const panel of first.panels) assert.ok(resized.panels.some(p => p.panelId === panel.panelId));
  assert.equal(new Set(first.panels.map(p => p.panelId)).size, first.panels.length);
  assert.equal(calculate({ doorCount: 0, shelfCount: 0 }).panels.length, 5);
  assert.equal(calculate({ doorCount: 1 }).panels.find(p => p.role === 'door').widthMm, 760);
});

// Independent vertex transform, not the engine's construction formulas.
function bounds(panel) {
  const [rx,ry,rz] = panel.pose.rotationRad;
  const vertices = [];
  for (const x of [-panel.widthMm/2,panel.widthMm/2]) for (const y of [-panel.heightMm/2,panel.heightMm/2]) for (const z of [-panel.thicknessMm/2,panel.thicknessMm/2]) {
    const y1 = y*Math.cos(rx)-z*Math.sin(rx), z1=y*Math.sin(rx)+z*Math.cos(rx);
    const x2=x*Math.cos(ry)+z1*Math.sin(ry), z2=-x*Math.sin(ry)+z1*Math.cos(ry);
    vertices.push([x2*Math.cos(rz)-y1*Math.sin(rz),x2*Math.sin(rz)+y1*Math.cos(rz),z2].map((v,i)=>v+panel.pose.positionMm[i]));
  }
  return [0,1,2].map(i=>[Math.min(...vertices.map(v=>v[i])),Math.max(...vertices.map(v=>v[i]))]);
}

test('transformed parts stay inside cabinet bounds without physical intersections across thickness and option cases', () => {
  for (const t of [12,18,25]) for (const backPosition of ['inset','outside']) for (const shelfCount of [0,1,4]) for (const doorCount of [0,1,2]) for (const skirtingHeightMm of [0,80]) {
    const result=calculate({ bodyThicknessMm:t, backPosition, shelfCount, doorCount, skirtingHeightMm });
    assert.deepEqual(result.blockingErrors, []);
    const boxes=result.panels.map(bounds);
    for (const box of boxes) box.forEach(([min,max],i)=>{assert.ok(min>=-1e-8);assert.ok(max<=[800,1200,400][i]+1e-8);});
    for (let i=0;i<boxes.length;i++) for (let j=i+1;j<boxes.length;j++) {
      const overlaps=boxes[i].every(([a,b],axis)=>Math.min(b,boxes[j][axis][1])-Math.max(a,boxes[j][axis][0])>1e-8);
      assert.equal(overlaps,false,`${result.panels[i].panelId} intersects ${result.panels[j].panelId}`);
    }
  }
});

