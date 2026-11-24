import { Button } from '@mattermost/compass-ui/components/button';
import { Modal, ModalOverlay } from '@mattermost/compass-ui/components/modal';
import { AFFECTED_POLICY, CLEARANCE_ATTRIBUTE } from '../mm64635Data';
import styles from './DeleteAttributeModal.module.scss';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteAttributeModal({ open, onClose, onConfirm }: Props) {
  return (
    <ModalOverlay open={open} onClose={onClose}>
      <Modal
        open={open}
        onClose={onClose}
        size="small"
        title={`Delete ${CLEARANCE_ATTRIBUTE} attribute`}
        headerDivider={false}
        footerDivider={false}
        footerType="2-actions"
        footer={
          <>
            <Button type="button" emphasis="tertiary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              emphasis="primary"
              destructive
              onClick={onConfirm}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className={styles['delete-attribute-modal']}>
          <p className={styles['delete-attribute-modal__text']}>
            {CLEARANCE_ATTRIBUTE} applies to users. The {AFFECTED_POLICY}{' '}
            membership policy still uses this attribute, and that policy will be
            flagged.
          </p>
          <p className={styles['delete-attribute-modal__text']}>
            Deleting this attribute will permanently remove its definition. This
            action cannot be undone.
          </p>
        </div>
      </Modal>
    </ModalOverlay>
  );
}
