/* eslint-disable react-refresh/only-export-components */
import { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const HomeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M3 12l9-9 9 9" />
    <path d="M5 10v10h14V10" />
  </svg>
);

export const HeartIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

export const CompareIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <rect x="3" y="4" width="7" height="16" rx="1.5" />
    <rect x="14" y="4" width="7" height="16" rx="1.5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

export const ReportIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
    <polyline points="14 3 14 9 20 9" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);

export const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={20} height={20} {...props}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const ChevronLeft = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const ChevronRight = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const HousingIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12l9-9 9 9" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

export const InfraIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 21H5a2 2 0 01-2-2V8l9-5 9 5v11a2 2 0 01-2 2z" />
    <path d="M12 12h.01" />
    <path d="M12 6v.01" />
    <path d="M9 21V14h6v7" />
  </svg>
);

export const TransitIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="3" width="16" height="16" rx="2" />
    <path d="M4 11h16" />
    <circle cx="8" cy="15" r="1" />
    <circle cx="16" cy="15" r="1" />
    <path d="M8 19l-2 3" />
    <path d="M16 19l2 3" />
  </svg>
);

export const EnvIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s7-3 7-12V5l-7-3-7 3v5c0 9 7 12 7 12z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const SafetyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33 1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export const InfoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={14} height={14} {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

export const EditIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={14} height={14} {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

export const CATEGORY_ICONS: Record<string, React.ComponentType<SVGProps<SVGSVGElement>>> = {
  housing: HousingIcon,
  infrastructure: InfraIcon,
  transit: TransitIcon,
  environment: EnvIcon,
  safety: SafetyIcon,
};
