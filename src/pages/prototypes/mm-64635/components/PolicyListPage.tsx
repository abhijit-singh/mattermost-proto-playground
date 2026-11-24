// why no Compass fits: Compass has no data table. This policy list table waits on a compass-design data table.
import DotsHorizontalIcon from '@mattermost/compass-icons/components/dots-horizontal';
import PlusIcon from '@mattermost/compass-icons/components/plus';
import RefreshIcon from '@mattermost/compass-icons/components/refresh';
import { WithTooltip } from '@mattermost/compass-proto';
import { AdminConsoleHeader } from '@mattermost/compass-ui/components/admin-console-header';
import { AdminPanel } from '@mattermost/compass-ui/components/admin-panel';
import { Button } from '@mattermost/compass-ui/components/button';
import { Icon } from '@mattermost/compass-ui/components/icon';
import { IconButton } from '@mattermost/compass-ui/components/icon-button';
import { Tag } from '@mattermost/compass-ui/components/tag';
import { POLICIES } from '../mm64635Data';
import SystemConsoleFrame from './SystemConsoleFrame';
import styles from './PolicyListPage.module.scss';

export default function PolicyListPage() {
  return (
    <SystemConsoleFrame
      section="policies"
      subtitle="Create policies containing attribute-based membership rules and the channels they apply to."
      header={
        <AdminConsoleHeader
          title="Membership Policies"
          trailing={
            <Button
              type="button"
              size="small"
              emphasis="primary"
              leadingIcon={<Icon glyph={<PlusIcon />} />}
            >
              Add policy
            </Button>
          }
        />
      }
    >
      <AdminPanel>
        <div className={styles['policy-list']}>
          <div className={styles['policy-list__toolbar']}>
            <WithTooltip label="Refresh list">
              <IconButton
                type="button"
                size="small"
                aria-label="Refresh list"
                icon={<Icon glyph={<RefreshIcon />} />}
              />
            </WithTooltip>
          </div>
          <table className={styles['policy-list__table']}>
            <caption className={styles['policy-list__caption']}>
              Membership policies
            </caption>
            <thead>
              <tr>
                <th className={styles['policy-list__head']} scope="col">
                  Name
                </th>
                <th className={styles['policy-list__head']} scope="col">
                  Applies to
                </th>
                <th
                  className={`${styles['policy-list__head']} ${styles['policy-list__actions']}`}
                  scope="col"
                >
                  <span className={styles['policy-list__caption']}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {POLICIES.map((policy) => (
                <tr key={policy.id}>
                  <th className={styles['policy-list__cell']} scope="row">
                    <div className={styles['policy-list__name']}>
                      <span className={styles['policy-list__policy-name']}>
                        {policy.name}
                      </span>
                      {policy.usesDeletedAttribute ? (
                        <Tag
                          label="Uses a deleted attribute"
                          type="warning"
                          size="small"
                        />
                      ) : null}
                    </div>
                  </th>
                  <td className={styles['policy-list__cell']}>{policy.appliesTo}</td>
                  <td
                    className={`${styles['policy-list__cell']} ${styles['policy-list__actions']}`}
                  >
                    <WithTooltip label="Policy actions menu">
                      <IconButton
                        type="button"
                        size="small"
                        padding="compact"
                        aria-label={`Policy actions menu for ${policy.name}`}
                        icon={<Icon glyph={<DotsHorizontalIcon />} />}
                      />
                    </WithTooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </SystemConsoleFrame>
  );
}
