import { useEffect, useMemo, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

export function useLabubus() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = getFirestore();
        const snap = await getDocs(collection(db, 'labubus'));
        const rows = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
        if (mounted) setItems(rows);
      } catch (e) {
        setError(String(e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const seriesOptions = useMemo(() => {
    const s = new Set(['All']);
    items.forEach(i => s.add(i.series || 'Unknown'));
    return Array.from(s);
  }, [items]);

  return { items, seriesOptions, loading, error };
}


