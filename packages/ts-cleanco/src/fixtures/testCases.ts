export const simpleTestCases = [
  ['name w/ suffix', 'Hello World Oy'],
  ["name w/ ', ltd.'", 'Hello World, ltd.'],
  ['name w/ ws suffix ws', 'Hello    World ltd'],
  ['name w/ suffix ws', 'Hello World ltd '],
  ['name w/ suffix dot ws', 'Hello World ltd. '],
  ['name w/ ws suffix dot ws', ' Hello World ltd. '],
];

export const multiCleanupTests = [
  ['name + suffix', 'Hello World Oy'],
  ['name + suffix (without punct)', 'Hello World sro'],
  ['prefix + name', 'Oy Hello World'],
  ['prefix + name + suffix', 'Oy Hello World Ab'],
  ['name w/ term in middle', 'Hello Oy World'],
  // ['name w/ complex term in middle', 'Hello pty ltd World'],
  ['name w/ mid + suffix', 'Hello Oy World Ab'],
];
