'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [personHits, setPersonHits] = useState<{ id: string; name: string; city: string }[]>([]);
  const [productHits, setProductHits] = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  const runSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setPersonHits([]);
      setProductHits([]);
      return;
    }
    try {
      const [pr, prod] = await Promise.all([
        fetch(`/api/persons?search=${encodeURIComponent(term)}&pageSize=5`, {
          credentials: 'include',
        }).then((r) => r.json()),
        fetch(`/api/products?search=${encodeURIComponent(term)}&pageSize=5`, {
          credentials: 'include',
        }).then((r) => r.json()),
      ]);
      if (pr.success) {
        setPersonHits(
          (pr.data as { id: string; name: string; city: string }[]).map((p) => ({
            id: p.id,
            name: p.name,
            city: p.city,
          }))
        );
      }
      if (prod.success) {
        setProductHits(
          (prod.data as { id: string; name: string }[]).map((p) => ({
            id: p.id,
            name: p.name,
          }))
        );
      }
    } catch {
      setPersonHits([]);
      setProductHits([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(q), 300);
    return () => clearTimeout(t);
  }, [q, runSearch]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="text-muted-foreground hidden w-48 justify-start gap-2 md:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Search…
        <kbd className="bg-muted ml-auto rounded px-1.5 text-[10px] font-medium">⌘K</kbd>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="size-5" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="HCPs and products">
        <Command>
          <CommandInput placeholder="Type to search…" value={q} onValueChange={setQ} />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            {personHits.length > 0 ? (
              <CommandGroup heading="HCPs">
                {personHits.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name} ${p.city}`}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/persons/${p.id}`);
                    }}
                  >
                    {p.name} — {p.city}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {productHits.length > 0 ? (
              <CommandGroup heading="Products">
                {productHits.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.name}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/products/${p.id}`);
                    }}
                  >
                    {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
