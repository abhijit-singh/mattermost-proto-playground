import { useState } from 'react';
import PlusIcon from '@mattermost/compass-icons/components/plus';
import { AdminConsoleHeader } from '@mattermost/compass-ui/components/admin-console-header';
import { AdminPanel } from '@mattermost/compass-ui/components/admin-panel';
import { Button } from '@mattermost/compass-ui/components/button';
import { Icon } from '@mattermost/compass-ui/components/icon';
import { SearchInput } from '@mattermost/compass-ui/components/search-input';
import { SectionNotice } from '@mattermost/compass-ui/components/section-notice';
import {
  AFFECTED_POLICY,
  attributesForScene,
  CLEARANCE_ATTRIBUTE,
} from '../mm64635Data';
import AttributeTable from './AttributeTable';
import DeleteAttributeModal from './DeleteAttributeModal';
import SystemConsoleFrame from './SystemConsoleFrame';
import styles from './AttributeManagementPage.module.scss';

export type AttributePageMode = 'delete-confirm' | 'after-delete' | 'delete-error';

type Props = {
  mode: AttributePageMode;
  onDeleted?: () => void;
  onViewFlaggedPolicy?: () => void;
};

export default function AttributeManagementPage({
  mode,
  onDeleted,
  onViewFlaggedPolicy,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(mode === 'delete-confirm');
  const includeClearance = mode !== 'after-delete';
  const rows = attributesForScene(includeClearance);
  const newAttributeEmphasis =
    mode === 'delete-confirm' && confirmOpen ? 'tertiary' : 'primary';

  return (
    <SystemConsoleFrame
      section="attributes"
      subtitle="Define an attribute once, then choose which resources can use it."
      header={
        <AdminConsoleHeader
          title="Attribute Management"
          trailing={
            <Button
              type="button"
              size="small"
              emphasis={newAttributeEmphasis}
              leadingIcon={<Icon glyph={<PlusIcon />} />}
            >
              New attribute
            </Button>
          }
        />
      }
    >
      <AdminPanel>
        <div className={styles['attribute-management']}>
          <div className={styles['attribute-management__search']}>
            <SearchInput
              size="small"
              placeholder="Search attributes"
              aria-label="Search attributes"
            />
          </div>
          {mode === 'delete-error' ? (
            <SectionNotice
              type="danger"
              role="alert"
              title={`Could not delete ${CLEARANCE_ATTRIBUTE}`}
              description={`${CLEARANCE_ATTRIBUTE} is still in the list. Open its actions and choose Delete attribute to try again.`}
            />
          ) : null}
          {mode === 'after-delete' ? (
            <SectionNotice
              type="info"
              role="status"
              title={`${AFFECTED_POLICY} still uses ${CLEARANCE_ATTRIBUTE}`}
              description={`${CLEARANCE_ATTRIBUTE} deleted. 1 membership policy still uses it.`}
              secondaryButtonLabel="View flagged policy"
              onSecondaryAction={onViewFlaggedPolicy}
            />
          ) : null}
          <AttributeTable rows={rows} caption="Attributes" />
        </div>
      </AdminPanel>
      {mode === 'delete-confirm' ? (
        <DeleteAttributeModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => onDeleted?.()}
        />
      ) : null}
    </SystemConsoleFrame>
  );
}
