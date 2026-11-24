import AttributeManagementPage from '../components/AttributeManagementPage';

type Props = {
  onViewFlaggedPolicy: () => void;
};

export default function AttributesAfterDelete({ onViewFlaggedPolicy }: Props) {
  return (
    <AttributeManagementPage
      mode="after-delete"
      onViewFlaggedPolicy={onViewFlaggedPolicy}
    />
  );
}
