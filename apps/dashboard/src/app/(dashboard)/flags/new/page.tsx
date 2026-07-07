import { FlagForm } from '@/components/molecules/FlagForm/FlagForm';
import styles from './page.module.scss';

export default function NewFlagPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Create Flag</h1>
      <FlagForm mode="create" />
    </div>
  );
}
