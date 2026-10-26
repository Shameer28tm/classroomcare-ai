/**
 * Noorul Islam Centre for Higher Education (NIU)
 * Centralized Institutional Configuration & Public Provenance
 * 
 * Source: Official University Website https://www.niuniv.com/
 * Retrieved: 2026-10-26
 */

export interface InstitutionalConfig {
  institutionName: string;
  institutionShortName: string;
  platformName: string;
  tagline: string;
  websiteUrl: string;
  campusCode: string;
  campusName: string;
  campusAddress: string;
  switchboardPhone: string;
  mobileHelpline: string;
  officialEmail: string;
  emergencyDesk: {
    primaryPhone: string;
    emergencyServices: string;
    description: string;
  };
  facilitiesLead: {
    displayName: string;
    role: string;
    status: 'unverified_demo' | 'provisioned_active';
    badgeNotice: string;
  };
  verifiedDepartments: string[];
}

export const NIU_CONFIG: InstitutionalConfig = {
  institutionName: 'Noorul Islam Centre for Higher Education',
  institutionShortName: 'NIU / NICHE',
  platformName: 'ClassroomCare AI — NIU Facilities & Campus Operations',
  tagline: 'Autonomous Classroom Maintenance & Facilities Intelligence Platform',
  websiteUrl: 'https://www.niuniv.com/',
  campusCode: 'NIU-KUMARACOIL',
  campusName: 'Main Campus — Kumaracoil',
  campusAddress: 'Kumaracoil, Thuckalay, Kanyakumari District, Tamil Nadu, India - 629 180',
  switchboardPhone: '(+91) 4651-250 566',
  mobileHelpline: '+91 94868 56101',
  officialEmail: 'info@niuniv.com',
  emergencyDesk: {
    primaryPhone: '(+91) 4651-250 566 (Campus Security Switchboard)',
    emergencyServices: '112 / 101 (Fire) / 108 (Ambulance)',
    description: 'National and Local Emergency Protocols for Kumaracoil Campus',
  },
  facilitiesLead: {
    displayName: 'Abishek',
    role: 'Facilities Manager',
    status: 'unverified_demo',
    badgeNotice: 'Demo Record (Unverified — Awaiting Official Administrator Provisioning)',
  },
  verifiedDepartments: [
    'Aeronautical Engineering',
    'Aerospace Engineering',
    'Aircraft Maintenance Engineering',
    'Automobile Engineering',
    'Biomedical Engineering',
    'Civil Engineering',
    'Computer Science and Engineering',
    'Electrical and Electronics Engineering',
    'Electronics and Communication Engineering',
    'Mechanical Engineering',
    'Marine Engineering',
    'Allied Health Sciences',
    'Management Studies',
    'Computer Applications',
    'Science & Humanities',
  ],
};
