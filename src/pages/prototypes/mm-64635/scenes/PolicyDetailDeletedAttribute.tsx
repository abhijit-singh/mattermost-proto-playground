import PolicyDetailPage from '../components/PolicyDetailPage';

type Props = {
  onBack: () => void;
};

export default function PolicyDetailDeletedAttribute({ onBack }: Props) {
  return <PolicyDetailPage onBack={onBack} />;
}
