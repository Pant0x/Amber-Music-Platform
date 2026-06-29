'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchView } from '@/components/pages/SearchView';
import { usePlayerStore } from '@/store/usePlayerStore';

function SearchPageContent() {
  const { setActiveTab, setSearchQuery } = usePlayerStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    setActiveTab('search');
    const q = searchParams?.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams, setActiveTab, setSearchQuery]);

  return <SearchView />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-2 py-16 text-xs text-zinc-500 font-semibold">
        Loading search...
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
