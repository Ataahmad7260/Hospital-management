export interface NavItem {
  label: string;
  href: string;
}

export interface ServiceCardItem {
  id: string;
  number: string;
  title: string;
  department: string;
  description: string;
  highlights: string[];
  iconName: string;
}

export interface StatisticItem {
  value: string;
  label: string;
  description: string;
  iconName: string;
}

export interface SpecialistItem {
  name: string;
  role: string;
  specialty: string;
  qualifications: string;
  experience: string;
  availability: string;
}

export interface FacilityHighlight {
  metric: string;
  title: string;
  description: string;
}

