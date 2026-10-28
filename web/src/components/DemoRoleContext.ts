import { createContext } from 'react';
import type { Role } from '../lib/auth';

// Guided browser navigation only. Local Java mode supplies no role orchestration.
export const DemoRoleContext = createContext<((role: Role) => Promise<void>) | null>(null);
