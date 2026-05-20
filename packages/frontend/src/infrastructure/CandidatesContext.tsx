import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { candidateStorage, StoredCandidate } from './candidateStorage';

interface CandidatesContextValue {
  candidates: StoredCandidate[];
  addCandidate: (input: {
    regionCode: string;
    regionName: string;
    parentRegionName: string;
    alias?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }) => StoredCandidate | { error: string };
  removeCandidate: (id: string) => void;
  updateAlias: (id: string, alias: string) => void;
  refresh: () => void;
}

const CandidatesContext = createContext<CandidatesContextValue | null>(null);

export function CandidatesProvider({ children }: { children: ReactNode }) {
  const [candidates, setCandidates] = useState<StoredCandidate[]>([]);

  const refresh = useCallback(() => {
    setCandidates(candidateStorage.list());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addCandidate = useCallback(
    (input: Parameters<typeof candidateStorage.add>[0]) => {
      const result = candidateStorage.add(input);
      if (!('error' in result)) {
        refresh();
      }
      return result;
    },
    [refresh],
  );

  const removeCandidate = useCallback(
    (id: string) => {
      candidateStorage.remove(id);
      refresh();
    },
    [refresh],
  );

  const updateAlias = useCallback(
    (id: string, alias: string) => {
      candidateStorage.updateAlias(id, alias);
      refresh();
    },
    [refresh],
  );

  const value = useMemo<CandidatesContextValue>(
    () => ({ candidates, addCandidate, removeCandidate, updateAlias, refresh }),
    [candidates, addCandidate, removeCandidate, updateAlias, refresh],
  );

  return (
    <CandidatesContext.Provider value={value}>{children}</CandidatesContext.Provider>
  );
}

export function useCandidates(): CandidatesContextValue {
  const ctx = useContext(CandidatesContext);
  if (!ctx) throw new Error('useCandidates must be used within CandidatesProvider');
  return ctx;
}
