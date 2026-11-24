// Stand-in rows for the prototype. Clearance is the attribute a membership
// policy still names after it is removed from Attribute Management.

export type AttributeRow = {
  id: string;
  name: string;
  type: string;
  appliesTo: string;
  source: string;
  options: string;
};

export const CLEARANCE_ATTRIBUTE = 'Clearance';
export const AFFECTED_POLICY = 'Mission rooms';
export const CLEAN_POLICY = 'Standup';

export const ATTRIBUTES: AttributeRow[] = [
  {
    id: 'clearance',
    name: CLEARANCE_ATTRIBUTE,
    type: 'Select',
    appliesTo: 'Users',
    source: 'Managed here',
    options: '4 options',
  },
  {
    id: 'program',
    name: 'Compartmented program access - Europe desk',
    type: 'Select',
    appliesTo: 'Users',
    source: 'Managed here',
    options: '6 options',
  },
  {
    id: 'department',
    name: 'Department',
    type: 'Text',
    appliesTo: 'Users',
    source: 'Managed here',
    options: 'Free Text',
  },
  {
    id: 'duty-station',
    name: 'Duty station',
    type: 'Text',
    appliesTo: 'Users',
    source: 'Managed here',
    options: 'Free Text',
  },
];

export function attributesForScene(includeClearance: boolean): AttributeRow[] {
  if (includeClearance) {
    return ATTRIBUTES;
  }
  return ATTRIBUTES.filter((row) => row.id !== 'clearance');
}

export type PolicyRow = {
  id: string;
  name: string;
  appliesTo: string;
  usesDeletedAttribute: boolean;
};

export const POLICIES: PolicyRow[] = [
  {
    id: 'mission-rooms',
    name: AFFECTED_POLICY,
    appliesTo: '3 channels',
    usesDeletedAttribute: true,
  },
  {
    id: 'standup',
    name: CLEAN_POLICY,
    appliesTo: '1 channel',
    usesDeletedAttribute: false,
  },
];

export const ASSIGNED_CHANNELS = [
  'Mission brief',
  'Field reports',
  'Europe desk',
];

export type PolicyRule = {
  id: string;
  attribute: string;
  operator: string;
  value: string;
};

export const MISSION_ROOM_RULES: PolicyRule[] = [
  {
    id: 'rule-clearance',
    attribute: 'clearance',
    operator: 'is',
    value: 'Top secret',
  },
  {
    id: 'rule-department',
    attribute: 'department',
    operator: 'is',
    value: 'Operations',
  },
];

// Attributes that still exist. Clearance is omitted: a deleted attribute is
// not a choice on a healthy rule or on Add attribute. The stale row keeps the
// stored name as its current value.
export const RULE_ATTRIBUTE_OPTIONS = [
  {
    value: 'program',
    label: 'Compartmented program access - Europe desk',
  },
  { value: 'department', label: 'Department' },
  { value: 'duty-station', label: 'Duty station' },
];

export const RULE_OPERATOR_OPTIONS = [{ value: 'is', label: 'is' }];

export const RULE_VALUE_OPTIONS: Record<string, { value: string; label: string }[]> =
  {
    clearance: [{ value: 'Top secret', label: 'Top secret' }],
    department: [{ value: 'Operations', label: 'Operations' }],
    program: [{ value: 'Europe desk', label: 'Europe desk' }],
    'duty-station': [{ value: 'Brussels', label: 'Brussels' }],
  };
