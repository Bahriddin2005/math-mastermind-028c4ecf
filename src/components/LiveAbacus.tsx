import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealisticAbacus } from '@/components/abacus/RealisticAbacus';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveAbacusProps {
  sessionId: string;
  isTeacher: boolean;
  onClose: () => void;
}

/**
 * Live Abacus — teacher controls, students watch in real-time.
 * Uses Supabase Realtime Broadcast for instant sync.
 */
export const LiveAbacus = ({ sessionId, isTeacher, onClose }: LiveAbacusProps) => {
  const [value, setValue] = useState(0);
  const [columns, setColumns] = useState(7);
  const [expanded, setExpanded] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Setup broadcast channel
  useEffect(() => {
    const channel = supabase.channel(`live-abacus-${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'abacus-state' }, (payload) => {
      if (payload.payload) {
        setValue(payload.payload.value ?? 0);
        if (payload.payload.columns) setColumns(payload.payload.columns);
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Teacher broadcasts state on change
  const handleChange = useCallback((newValue: number) => {
    setValue(newValue);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'abacus-state',
      payload: { value: newValue, columns },
    });
  }, [columns]);

  // Teacher changes column count
  const handleColumnsChange = useCallback((newCols: number) => {
    setColumns(newCols);
    setValue(0);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'abacus-state',
      payload: { value: 0, columns: newCols },
    });
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`
          ${expanded
            ? 'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm'
            : 'absolute bottom-16 left-2 right-2 z-30 max-h-[70vh]'
          }
          flex flex-col rounded-t-2xl border border-border shadow-2xl overflow-hidden
        `}
        style={!expanded ? { background: 'var(--card)' } : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-card shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧮</span>
            <h3 className="font-bold text-sm">Live Abakus</h3>
            <Badge variant={isTeacher ? 'default' : 'secondary'} className="text-[10px]">
              {isTeacher ? "Boshqaruvchi" : "Kuzatuvchi"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(e => !e)}>
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Column selector (teacher only) */}
        {isTeacher && (
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 shrink-0">
            <span className="text-xs text-muted-foreground">Ustunlar:</span>
            {[5, 7, 9, 13].map(c => (
              <Button
                key={c}
                size="sm"
                variant={columns === c ? 'default' : 'outline'}
                className="h-7 px-2.5 text-xs"
                onClick={() => handleColumnsChange(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        )}

        {/* Abacus */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-2">
          <div className="w-full" style={{ transform: expanded ? 'scale(1)' : 'scale(0.85)', transformOrigin: 'center center' }}>
            <RealisticAbacus
              columns={columns}
              value={value}
              onChange={isTeacher ? handleChange : undefined}
              readOnly={!isTeacher}
              mode="beginner"
              compact={!expanded}
              showValue
              colorScheme="classic"
            />
          </div>
        </div>

        {/* Value display for students */}
        {!isTeacher && (
          <div className="text-center py-2 border-t bg-muted/20 shrink-0">
            <p className="text-xs text-muted-foreground">O'qituvchi tomonidan boshqarilmoqda</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
