// why no Compass fits: Compass has no data table. This rule grid waits on a compass-design data table.
import { useRef, useState } from 'react';
import TrashCanOutlineIcon from '@mattermost/compass-icons/components/trash-can-outline';
import { WithTooltip } from '@mattermost/compass-proto';
import { AdminConsoleFooter } from '@mattermost/compass-ui/components/admin-console-footer';
import { AdminConsoleHeader } from '@mattermost/compass-ui/components/admin-console-header';
import { AdminPanel } from '@mattermost/compass-ui/components/admin-panel';
import { Button } from '@mattermost/compass-ui/components/button';
import { Icon } from '@mattermost/compass-ui/components/icon';
import { IconButton } from '@mattermost/compass-ui/components/icon-button';
import { SectionNotice } from '@mattermost/compass-ui/components/section-notice';
import { Select } from '@mattermost/compass-ui/components/select';
import { Tag } from '@mattermost/compass-ui/components/tag';
import { TextInput } from '@mattermost/compass-ui/components/text-input';
import {
  AFFECTED_POLICY,
  ASSIGNED_CHANNELS,
  CLEARANCE_ATTRIBUTE,
  MISSION_ROOM_RULES,
  RULE_ATTRIBUTE_OPTIONS,
  RULE_OPERATOR_OPTIONS,
  RULE_VALUE_OPTIONS,
  type PolicyRule,
} from '../mm64635Data';
import SystemConsoleFrame from './SystemConsoleFrame';
import styles from './PolicyDetailPage.module.scss';

type Props = {
  onBack: () => void;
};

function ruleUsesDeletedAttribute(rule: PolicyRule): boolean {
  return rule.attribute === 'clearance';
}

export default function PolicyDetailPage({ onBack }: Props) {
  const [policyName, setPolicyName] = useState(AFFECTED_POLICY);
  const [rules, setRules] = useState(MISSION_ROOM_RULES);
  const addedRuleCount = useRef(0);
  const hasDeletedAttribute = rules.some(ruleUsesDeletedAttribute);

  function addRule() {
    addedRuleCount.current += 1;
    const id = `rule-added-${addedRuleCount.current}`;
    setRules((current) => [
      ...current,
      { id, attribute: '', operator: 'is', value: '' },
    ]);
  }

  function removeRule(id: string) {
    setRules((current) => current.filter((rule) => rule.id !== id));
  }

  return (
    <SystemConsoleFrame
      section="policies"
      header={
        <AdminConsoleHeader
          title="Edit Membership Policy"
          showBack
          ariaLabelBack="Go back"
          onBackClick={onBack}
        />
      }
      footer={
        <AdminConsoleFooter
          saveLabel="Save"
          cancelLabel="Cancel"
          saveDisabled={false}
          onSave={() => undefined}
          onCancel={onBack}
        />
      }
    >
      <div className={styles['policy-detail']}>
        <div className={styles['policy-detail__name']}>
          <TextInput
            id="membership-policy-name"
            type="text"
            label="Membership policy name"
            value={policyName}
            onChange={(event) => setPolicyName(event.target.value)}
            autoComplete="off"
          />
        </div>
        <AdminPanel
          title="Attribute-based membership rules"
          subtitle="Select user attributes and values that qualifying users must have"
          headerActions={
            <Button type="button" emphasis="tertiary" size="small">
              Switch to advanced mode
            </Button>
          }
        >
          <div className={styles['policy-detail__rules']}>
            {hasDeletedAttribute ? (
              <SectionNotice
                type="warning"
                title="A rule still uses a deleted attribute"
                description={`${CLEARANCE_ATTRIBUTE} no longer exists. Edit or remove the marked rule.`}
              />
            ) : null}
            <div
              className={styles['policy-detail__columns']}
              aria-hidden="true"
            >
              <span className={styles['policy-detail__column']}>Attribute</span>
              <span className={styles['policy-detail__column']}>Operator</span>
              <span className={styles['policy-detail__column']}>Values</span>
              <span className={styles['policy-detail__column']} />
            </div>
            {rules.map((rule, index) => {
              const marked = ruleUsesDeletedAttribute(rule);
              const ruleNumber = index + 1;
              const valueOptions = RULE_VALUE_OPTIONS[rule.attribute] ?? [];
              return (
                <div key={rule.id} className={styles['policy-detail__rule']}>
                  <div className={styles['policy-detail__attribute']}>
                    <Select
                      id={`${rule.id}-attribute`}
                      className={styles['policy-detail__select']}
                      size="small"
                      aria-label={`Attribute for rule ${ruleNumber}`}
                      options={RULE_ATTRIBUTE_OPTIONS}
                      value={rule.attribute}
                      placeholder={
                        marked ? CLEARANCE_ATTRIBUTE : 'Select attribute'
                      }
                      onChange={(value) => {
                        setRules((current) =>
                          current.map((item) =>
                            item.id === rule.id
                              ? {
                                  ...item,
                                  attribute: value,
                                  value:
                                    RULE_VALUE_OPTIONS[value]?.[0]?.value ??
                                    '',
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                    {marked ? (
                      <Tag
                        label="Deleted attribute"
                        type="warning"
                        size="small"
                      />
                    ) : null}
                  </div>
                  <Select
                    id={`${rule.id}-operator`}
                    size="small"
                    aria-label={`Operator for rule ${ruleNumber}`}
                    options={RULE_OPERATOR_OPTIONS}
                    value={rule.operator}
                    onChange={(value) => {
                      setRules((current) =>
                        current.map((item) =>
                          item.id === rule.id
                            ? { ...item, operator: value }
                            : item,
                        ),
                      );
                    }}
                  />
                  <Select
                    id={`${rule.id}-value`}
                    size="small"
                    aria-label={`Values for rule ${ruleNumber}`}
                    options={valueOptions}
                    value={rule.value}
                    placeholder="Select value"
                    onChange={(value) => {
                      setRules((current) =>
                        current.map((item) =>
                          item.id === rule.id ? { ...item, value } : item,
                        ),
                      );
                    }}
                  />
                  <div className={styles['policy-detail__remove']}>
                    <WithTooltip label="Remove row">
                      <IconButton
                        type="button"
                        size="small"
                        padding="compact"
                        aria-label="Remove row"
                        icon={<Icon glyph={<TrashCanOutlineIcon />} />}
                        onClick={() => removeRule(rule.id)}
                      />
                    </WithTooltip>
                  </div>
                </div>
              );
            })}
            <Button
              type="button"
              emphasis="tertiary"
              size="small"
              className={styles['policy-detail__add']}
              onClick={addRule}
            >
              Add attribute
            </Button>
            <p className={styles['policy-detail__help']}>
              Each row is a single condition that must be met for a user to
              comply with the policy. All rules are combined with logical AND
              operator (`&amp;&amp;`).
            </p>
          </div>
        </AdminPanel>
        <AdminPanel
          title="Assigned channels"
          subtitle="Add channels that this membership policy will apply to."
          headerActions={
            <Button type="button" emphasis="tertiary" size="small">
              Add channels
            </Button>
          }
        >
          <ul className={styles['policy-detail__channels']}>
            {ASSIGNED_CHANNELS.map((channel) => (
              <li key={channel} className={styles['policy-detail__channel']}>
                {channel}
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>
    </SystemConsoleFrame>
  );
}
