import { useEffect, useState, useCallback } from "react";
import { subscribe } from "./store.js";

// Forces a re-render whenever the mock backend emits a change
// (new report, verification, admin action, etc).
export function useStoreVersion() {
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => subscribe(bump), [bump]);
}
