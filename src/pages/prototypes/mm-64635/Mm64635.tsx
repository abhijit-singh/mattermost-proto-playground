import { useEffect, useState } from 'react';
import SceneSwitcher from '@/components/navigation/SceneSwitcher/SceneSwitcher';
import { usePrototypeChrome } from '@/contexts/PrototypeChromeContext';
import AttributesAfterDelete from './scenes/AttributesAfterDelete';
import AttributesDeleteConfirm from './scenes/AttributesDeleteConfirm';
import AttributesDeleteError from './scenes/AttributesDeleteError';
import PolicyDetailDeletedAttribute from './scenes/PolicyDetailDeletedAttribute';
import PolicyListDeletedAttribute from './scenes/PolicyListDeletedAttribute';
import { isSceneId, SCENES, type SceneId } from './mm64635Scenes';

export default function Mm64635() {
  const { setCenterSlot } = usePrototypeChrome();
  const [scene, setScene] = useState<SceneId>('attributes-delete-confirm');

  useEffect(() => {
    setCenterSlot(
      <SceneSwitcher
        scenes={SCENES}
        activeId={scene}
        onChange={(id) => {
          if (isSceneId(id)) {
            setScene(id);
          }
        }}
        ariaLabel="Deleted attribute scenes"
      />,
    );
    return () => setCenterSlot(null);
  }, [scene, setCenterSlot]);

  return renderScene(scene, setScene);
}

function renderScene(scene: SceneId, setScene: (next: SceneId) => void) {
  switch (scene) {
    case 'attributes-delete-confirm':
      return (
        <AttributesDeleteConfirm
          onDeleted={() => setScene('attributes-after-delete')}
        />
      );
    case 'attributes-after-delete':
      return (
        <AttributesAfterDelete
          onViewFlaggedPolicy={() =>
            setScene('policy-detail-deleted-attribute')
          }
        />
      );
    case 'policy-list-deleted-attribute':
      return <PolicyListDeletedAttribute />;
    case 'policy-detail-deleted-attribute':
      return (
        <PolicyDetailDeletedAttribute
          onBack={() => setScene('policy-list-deleted-attribute')}
        />
      );
    case 'attributes-delete-error':
      return <AttributesDeleteError />;
    default: {
      const unreachable: never = scene;
      return unreachable;
    }
  }
}
