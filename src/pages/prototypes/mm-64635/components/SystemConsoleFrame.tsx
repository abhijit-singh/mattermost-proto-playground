// why no Compass fits: Compass has no admin console page shell. This frame waits on a compass-design admin console page shell.
import type { ReactNode } from 'react';
import { AdminConsoleSidebar } from '@mattermost/compass-proto';
import type { AdminConsoleSidebarGroupModel } from '@mattermost/compass-proto';
import { Scrollbar } from '@mattermost/compass-ui/components/scrollbar';
import avatarLeonard from '@/assets/avatars/Leonard Riley.png';
import styles from './SystemConsoleFrame.module.scss';

type ConsoleSection = 'attributes' | 'policies';

type Props = {
  section: ConsoleSection;
  subtitle?: ReactNode;
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

function sidebarGroups(section: ConsoleSection): AdminConsoleSidebarGroupModel[] {
  return [
    {
      key: 'system-attributes',
      categoryLabel: 'System Attributes',
      categoryIconKey: 'users',
      items: [
        { name: 'Attribute-Based Access' },
        {
          name: 'Attribute Management',
          active: section === 'attributes',
        },
        {
          name: 'Membership Policies',
          active: section === 'policies',
        },
      ],
    },
  ];
}

export default function SystemConsoleFrame({
  section,
  subtitle,
  header,
  footer,
  children,
}: Props) {
  return (
    <div className={styles['system-console']}>
      <div className={styles['system-console__sidebar']}>
        <AdminConsoleSidebar
          avatarSrc={avatarLeonard}
          avatarAlt="Leonard Riley"
          userDisplayName="Leonard Riley"
          groups={sidebarGroups(section)}
        />
      </div>
      <div className={styles['system-console__main']}>
        {header}
        <div className={styles['system-console__body']}>
          <div className={styles['system-console__scroll']}>
            <Scrollbar>
              <div className={styles['system-console__content']}>
                {subtitle ? (
                  <p className={styles['system-console__subtitle']}>{subtitle}</p>
                ) : null}
                {children}
              </div>
            </Scrollbar>
          </div>
        </div>
        {footer}
      </div>
    </div>
  );
}
