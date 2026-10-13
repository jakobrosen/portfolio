import type { Table, TableShape } from "../types";

export type Preset = {
  key: string;
  shape: TableShape;
  width: number;
  height: number;
  seats: number;
};

// One starting table per shape. They're sized to fit after placing them.
export const presets: Preset[] = [
  { key: "rect", shape: "rect", width: 120, height: 80, seats: 4 },
  { key: "round", shape: "round", width: 100, height: 100, seats: 4 },
];

// A table built from a preset, used for previews before it's placed.
export function presetTable(preset: Preset, x = 0, y = 0): Table {
  const { shape, width, height, seats } = preset;
  return { id: preset.key, label: "", shape, x, y, width, height, seats };
}

// The next free "T<n>" label, one past the highest number in use.
export function nextLabel(tables: Table[]) {
  const numbers = tables.map((table) =>
    Number(/^T(\d+)$/.exec(table.label)?.[1] ?? 0),
  );
  return `T${Math.max(0, ...numbers) + 1}`;
}
