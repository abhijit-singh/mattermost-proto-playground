// why no Compass fits: Compass has no data table. This attribute table waits on a compass-design data table.
import DotsHorizontalIcon from '@mattermost/compass-icons/components/dots-horizontal';
import { WithTooltip } from '@mattermost/compass-proto';
import { Icon } from '@mattermost/compass-ui/components/icon';
import { IconButton } from '@mattermost/compass-ui/components/icon-button';
import type { AttributeRow } from '../mm64635Data';
import styles from './AttributeTable.module.scss';

type Props = {
  rows: AttributeRow[];
  caption: string;
};

export default function AttributeTable({ rows, caption }: Props) {
  return (
    <table className={styles['attribute-table']}>
      <caption className={styles['attribute-table__caption']}>{caption}</caption>
      <thead>
        <tr>
          <th className={styles['attribute-table__head']} scope="col">
            Attribute
          </th>
          <th className={styles['attribute-table__head']} scope="col">
            Type
          </th>
          <th className={styles['attribute-table__head']} scope="col">
            Applies to
          </th>
          <th className={styles['attribute-table__head']} scope="col">
            Source
          </th>
          <th className={styles['attribute-table__head']} scope="col">
            Options
          </th>
          <th
            className={`${styles['attribute-table__head']} ${styles['attribute-table__actions']}`}
            scope="col"
          >
            <span className={styles['attribute-table__caption']}>Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <th className={styles['attribute-table__cell']} scope="row">
              <span className={styles['attribute-table__name']}>{row.name}</span>
            </th>
            <td className={styles['attribute-table__cell']}>{row.type}</td>
            <td className={styles['attribute-table__cell']}>{row.appliesTo}</td>
            <td className={styles['attribute-table__cell']}>{row.source}</td>
            <td className={styles['attribute-table__cell']}>{row.options}</td>
            <td
              className={`${styles['attribute-table__cell']} ${styles['attribute-table__actions']}`}
            >
              <WithTooltip label="More actions">
                <IconButton
                  type="button"
                  size="small"
                  padding="compact"
                  aria-label={`More actions for ${row.name}`}
                  icon={<Icon glyph={<DotsHorizontalIcon />} />}
                />
              </WithTooltip>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
