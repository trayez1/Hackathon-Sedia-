import { createContext, useContext, useState } from "react";

const ProfileContext = createContext(null);

export const PROFILES = [
  { id: "wheelchair", label: "Wheelchair", icon: "♿", description: "Step-free routes, ramps, lifts, accessible entrances." },
  { id: "mobility", label: "Mobility impairment", icon: "🦯", description: "Avoids stairs, steep slopes, long distances, uneven surfaces." },
  { id: "visual", label: "Visual impairment", icon: "👁", description: "Coming soon — supported by the data model, not yet in this MVP." },
];

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState("wheelchair");
  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
