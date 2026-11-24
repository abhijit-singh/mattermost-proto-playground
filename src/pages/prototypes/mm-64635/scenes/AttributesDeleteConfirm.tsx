import AttributeManagementPage from '../components/AttributeManagementPage';

type Props = {
  onDeleted: () => void;
};

export default function AttributesDeleteConfirm({ onDeleted }: Props) {
  return <AttributeManagementPage mode="delete-confirm" onDeleted={onDeleted} />;
}
