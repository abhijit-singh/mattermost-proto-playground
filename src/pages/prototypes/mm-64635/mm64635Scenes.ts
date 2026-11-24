export type SceneId =
  | 'attributes-delete-confirm'
  | 'attributes-after-delete'
  | 'policy-list-deleted-attribute'
  | 'policy-detail-deleted-attribute'
  | 'attributes-delete-error';

export const SCENES: { id: SceneId; label: string }[] = [
  { id: 'attributes-delete-confirm', label: 'Delete confirm' },
  { id: 'attributes-after-delete', label: 'After delete' },
  { id: 'policy-list-deleted-attribute', label: 'Policy list' },
  { id: 'policy-detail-deleted-attribute', label: 'Policy detail' },
  { id: 'attributes-delete-error', label: 'Delete error' },
];

const SCENE_IDS: SceneId[] = SCENES.map((scene) => scene.id);

export function isSceneId(value: string): value is SceneId {
  return (SCENE_IDS as string[]).includes(value);
}
