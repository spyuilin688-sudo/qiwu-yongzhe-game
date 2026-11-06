import { SLOT_IDS, UNIT_KINDS, UNIT_LABELS, type ContentCatalog } from '@qiwu/content';
import type { ReactNode } from 'react';
import { MapBackdrop } from './backgrounds/MapBackdrop.tsx';
import { HeroArt } from './heroes/HeroArt.tsx';
import { EquipIcon } from './icons/EquipIcon.tsx';
import { JobEmblem } from './icons/JobEmblem.tsx';
import { SkillIcon } from './icons/SkillIcon.tsx';
import { SlotIcon } from './icons/SlotIcon.tsx';
import { UiIcon } from './icons/UiIcon.tsx';
import { heroLookFor } from './mapping.ts';
import { AddArt } from './monsters/BossArt.tsx';
import { MonsterArt } from './monsters/MonsterArt.tsx';
import type { FamilyKey, UiIconName } from './types.ts';
import { UnitArt } from './units/UnitArt.tsx';

/**
 * 美術總覽（僅開發模式：網址加 ?gallery=1）。用來在手機與桌面檢查全部原創 SVG 資產，
 * 也是視覺審查與截圖的固定入口；正式建置不會載入。
 */
export const UI_ICON_NAMES: readonly UiIconName[] = [
  'adventure', 'character', 'skills', 'codex', 'more', 'coin', 'relic', 'lens', 'lock', 'boss',
  'filter', 'route', 'bag', 'close', 'up', 'down', 'check', 'warning', 'timer', 'star',
];
export const FAMILY_KEYS: readonly FamilyKey[] = ['novice', 'sword', 'bow', 'mage', 'rogue', 'priest', 'jester', 'artisan'];

function Section({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section id={id} style={{ padding: 12, borderBottom: '1px solid #4b3b2c' }}>
      <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>{title}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </section>
  );
}

function Cell({ label, children, width = 72 }: { label: string; children: ReactNode; width?: number }) {
  return (
    <figure style={{ margin: 0, width, textAlign: 'center', fontSize: 10, color: '#cdbca4' }}>
      <div style={{ background: '#2b2119', borderRadius: 8, padding: 4 }}>{children}</div>
      <figcaption style={{ overflowWrap: 'anywhere' }}>{label}</figcaption>
    </figure>
  );
}

export function Gallery({ catalog }: { catalog: ContentCatalog }) {
  const monsters = [...catalog.monsters.values()];
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#15100c', color: '#f4ead9', fontFamily: 'system-ui' }} data-testid="art-gallery">
      <Section title="角色（35 職業節點＋見習者）" id="heroes">
        {catalog.jobOrder.map((jobId) => {
          const look = heroLookFor(catalog, jobId);
          return (
            <Cell key={jobId} label={catalog.jobs.get(jobId)?.name ?? jobId}>
              <HeroArt {...look} size={56} />
            </Cell>
          );
        })}
      </Section>
      <Section title="職業系徽章" id="emblems">
        {FAMILY_KEYS.map((family) => (
          <Cell key={family} label={family}>
            <JobEmblem family={family} size={40} />
          </Cell>
        ))}
      </Section>
      <Section title={`怪物（${monsters.length}）`} id="monsters">
        {monsters.map((monster) => (
          <Cell key={monster.id} label={`${monster.name}`} width={monster.kind === 'boss' ? 120 : 72}>
            <MonsterArt monsterId={monster.id} size={monster.kind === 'boss' ? 112 : 64} />
          </Cell>
        ))}
      </Section>
      <Section title="BOSS 副目標" id="adds">
        {[...catalog.maps.values()].map((map) => (
          <Cell key={map.id} label={`${map.number} ${map.bossMechanics.find((m) => m.kind === 'periodicAdds')?.kind === 'periodicAdds' ? '' : '（無副目標）'}`}>
            <AddArt mapNumber={map.number} size={48} />
          </Cell>
        ))}
      </Section>
      <Section title="地圖背景（12）" id="backdrops">
        {[...catalog.maps.values()].map((map) => (
          <Cell key={map.id} label={map.name} width={195}>
            <div style={{ width: 187, height: 130 }}>
              <MapBackdrop mapNumber={map.number} />
            </div>
          </Cell>
        ))}
      </Section>
      <Section title="介面圖示" id="ui-icons">
        {UI_ICON_NAMES.map((name) => (
          <Cell key={name} label={name} width={56}>
            <UiIcon name={name} size={28} />
          </Cell>
        ))}
      </Section>
      <Section title="部位圖示" id="slot-icons">
        {SLOT_IDS.map((slot) => (
          <Cell key={slot} label={slot} width={56}>
            <SlotIcon slot={slot} size={28} />
          </Cell>
        ))}
      </Section>
      <Section title="裝備基底（88）" id="equipment">
        {catalog.equipmentOrder.map((id) => {
          const base = catalog.equipment.get(id)!;
          return (
            <Cell key={id} label={base.name}>
              <EquipIcon baseId={base.id} typeName={base.typeName} slot={base.slot} size={48} />
            </Cell>
          );
        })}
      </Section>
      <Section title={`召喚物與區域（${UNIT_KINDS.length}）`} id="units">
        {UNIT_KINDS.map((kind) => (
          <Cell key={kind} label={UNIT_LABELS[kind]}>
            <UnitArt kind={kind} size={48} />
          </Cell>
        ))}
      </Section>
      <Section title="技能（70）" id="skills">
        {[...catalog.skills.values()].map((skill) => (
          <Cell key={skill.id} label={skill.name}>
            <SkillIcon skillId={skill.id} size={48} />
          </Cell>
        ))}
      </Section>
    </div>
  );
}
